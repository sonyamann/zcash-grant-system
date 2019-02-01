from dateutil.parser import parse
from flask import Blueprint, g
from grant.comment.models import Comment, comment_schema, comments_schema
from grant.email.send import send_email
from grant.milestone.models import Milestone
from grant.rfp.models import RFP
from grant.settings import EXPLORER_URL
from grant.user.models import User
from grant.utils.auth import requires_auth, requires_team_member_auth, get_authed_user, internal_webhook
from grant.utils.enums import ProposalStatus, ContributionStatus
from grant.utils.exceptions import ValidationException
from grant.utils.misc import is_email, make_url, from_zat, make_preview
from sqlalchemy import or_
from webargs import fields
from webargs.flaskparser import use_args

from .models import (
    Proposal,
    proposals_schema,
    proposal_schema,
    ProposalUpdate,
    proposal_update_schema,
    ProposalContribution,
    proposal_contribution_schema,
    proposal_team,
    ProposalTeamInvite,
    proposal_team_invite_schema,
    proposal_proposal_contributions_schema,
    db,
)

blueprint = Blueprint("proposal", __name__, url_prefix="/api/v1/proposals")


@blueprint.route("/<proposal_id>", methods=["GET"])
def get_proposal(proposal_id):
    proposal = Proposal.query.filter_by(id=proposal_id).first()
    if proposal:
        if proposal.status != ProposalStatus.LIVE:
            if proposal.status == ProposalStatus.DELETED:
                return {"message": "Proposal was deleted"}, 404
            authed_user = get_authed_user()
            team_ids = list(x.id for x in proposal.team)
            if not authed_user or authed_user.id not in team_ids:
                return {"message": "User cannot view this proposal"}, 404
        return proposal_schema.dump(proposal)
    else:
        return {"message": "No proposal matching id"}, 404


@blueprint.route("/<proposal_id>/comments", methods=["GET"])
def get_proposal_comments(proposal_id):
    proposal = Proposal.query.filter_by(id=proposal_id).first()
    if not proposal:
        return {"message": "No proposal matching id"}, 404

    # Only pull top comments, replies will be attached to them
    comments = Comment.query.filter_by(proposal_id=proposal_id, parent_comment_id=None)
    num_comments = Comment.query.filter_by(proposal_id=proposal_id).count()
    return {
        "proposalId": proposal_id,
        "totalComments": num_comments,
        "comments": comments_schema.dump(comments)
    }


comments_POST_args = {
    "comment": fields.Str(required=True),
    "parentCommentId": fields.Int(required=False)
}


@blueprint.route("/<proposal_id>/comments", methods=["POST"])
@requires_auth
@use_args(comments_POST_args)
def post_proposal_comments(args, proposal_id):
    comment = args.get("comment")
    parent_comment_id = args.get("parentCommentId")
    # Make sure proposal exists
    proposal = Proposal.query.filter_by(id=proposal_id).first()
    if not proposal:
        return {"message": "No proposal matching id"}, 404

    # Make sure the parent comment exists
    parent = None
    if parent_comment_id:
        parent = Comment.query.filter_by(id=parent_comment_id).first()
        if not parent:
            return {"message": "Parent comment doesn’t exist"}, 400

    # Make sure user has verified their email
    if not g.current_user.email_verification.has_verified:
        message = "Please confirm your email before commenting."
        return {"message": message}, 401

    # Make the comment
    comment = Comment(
        proposal_id=proposal_id,
        user_id=g.current_user.id,
        parent_comment_id=parent_comment_id,
        content=comment
    )
    db.session.add(comment)
    db.session.commit()
    dumped_comment = comment_schema.dump(comment)

    # TODO: Email proposal team if top-level comment
    preview = make_preview(comment.content, 60)
    if not parent:
        for member in proposal.team:
            send_email(member.email_address, 'proposal_comment', {
                'author': g.current_user,
                'proposal': proposal,
                'preview': preview,
                'comment_url': make_url(f'/proposal/{proposal.id}?tab=discussions&comment={comment.id}'),
                'author_url': make_url(f'/profile/{comment.author.id}'),
            })
    # Email parent comment creator, if it's not themselves
    if parent and parent.author.id != comment.author.id:
        send_email(parent.author.email_address, 'comment_reply', {
            'author': g.current_user,
            'proposal': proposal,
            'preview': preview,
            'comment_url': make_url(f'/proposal/{proposal.id}?tab=discussions&comment={comment.id}'),
            'author_url': make_url(f'/profile/{comment.author.id}'),
        })

    return dumped_comment, 201


proposal_GET_args = {
    "stage": fields.Str(required=False)
}


@blueprint.route("/", methods=["GET"])
@use_args(proposal_GET_args)
def get_proposals(args):
    stage = args.get("stage")
    if stage:
        proposals = (
            Proposal.query.filter_by(status=ProposalStatus.LIVE, stage=stage)
                .order_by(Proposal.date_created.desc())
                .all()
        )
    else:
        proposals = (
            Proposal.query.filter_by(status=ProposalStatus.LIVE)
                .order_by(Proposal.date_created.desc())
                .all()
        )
    dumped_proposals = proposals_schema.dump(proposals)
    return dumped_proposals


drafts_POST_args = {
    "rfpId": fields.Int(required=False)
}


@blueprint.route("/drafts", methods=["POST"])
@requires_auth
@use_args(drafts_POST_args)
def make_proposal_draft(args):
    rfp_id = args.get("rfpId")
    proposal = Proposal.create(status=ProposalStatus.DRAFT)
    proposal.team.append(g.current_user)

    if rfp_id:
        rfp = RFP.query.filter_by(id=rfp_id).first()
        if not rfp:
            return {"message": "The request this proposal was made for doesn’t exist"}, 400
        proposal.title = rfp.title
        proposal.brief = rfp.brief
        proposal.category = rfp.category
        rfp.proposals.append(proposal)
        db.session.add(rfp)

    db.session.add(proposal)
    db.session.commit()
    return proposal_schema.dump(proposal), 201


@blueprint.route("/drafts", methods=["GET"])
@requires_auth
def get_proposal_drafts():
    proposals = (
        Proposal.query
            .filter(or_(
            Proposal.status == ProposalStatus.DRAFT,
            Proposal.status == ProposalStatus.REJECTED,
        ))
            .join(proposal_team)
            .filter(proposal_team.c.user_id == g.current_user.id)
            .order_by(Proposal.date_created.desc())
            .all()
    )
    return proposals_schema.dump(proposals), 200


proposal_PUT_args = {
    "title": fields.Str(required=False),
    "brief": fields.Str(required=False),
    "category": fields.Str(required=False),
    "content": fields.Str(required=False),
    "target": fields.Str(required=False),
    "payoutAddress": fields.Str(required=False),
    "deadlineDuration": fields.Int(required=False),
    "milestones": fields.Nested(
        {
            "title": fields.Str(required=True),
            "content": fields.Str(required=True),
            "dateEstimated": fields.Str(required=True),  # TODO add validation
            "payoutPercent": fields.Int(required=True),
            "immediatePayout": fields.Bool(required=True)

        },
        required=False,
        many=True
    )

}


@blueprint.route("/<proposal_id>", methods=["PUT"])
@requires_team_member_auth
@use_args(proposal_PUT_args)
def update_proposal(args, proposal_id):
    title = args["title"]
    brief = args["brief"]
    category = args["category"]
    content = args["content"]
    target = args["target"]
    payout_address = args["payoutAddress"]
    deadline_duration = args["deadlineDuration"]
    milestones = args["milestones"]

    # Update the base proposal fields
    try:
        g.current_proposal.update(
            title=title,
            brief=brief,
            category=category,
            content=content,
            target=target,
            payout_address=payout_address,
            deadline_duration=deadline_duration
        )
    except ValidationException as e:
        return {"message": "{}".format(str(e))}, 400
    db.session.add(g.current_proposal)
    # Delete & re-add milestones
    [db.session.delete(x) for x in g.current_proposal.milestones]
    if milestones:
        for mdata in milestones:
            m = Milestone(
                title=mdata["title"],
                content=mdata["content"],
                date_estimated=parse(mdata["dateEstimated"]),
                payout_percent=str(mdata["payoutPercent"]),
                immediate_payout=mdata["immediatePayout"],
                proposal_id=g.current_proposal.id
            )
            db.session.add(m)

    # Commit
    db.session.commit()
    return proposal_schema.dump(g.current_proposal), 200


@blueprint.route("/<proposal_id>", methods=["DELETE"])
@requires_team_member_auth
def delete_proposal(proposal_id):
    deleteable_statuses = [
        ProposalStatus.DRAFT,
        ProposalStatus.PENDING,
        ProposalStatus.APPROVED,
        ProposalStatus.REJECTED,
    ]
    status = g.current_proposal.status
    if status not in deleteable_statuses:
        return {"message": "Cannot delete proposals with %s status" % status}, 400
    db.session.delete(g.current_proposal)
    db.session.commit()
    return {"message": None}, 202


@blueprint.route("/<proposal_id>/submit_for_approval", methods=["PUT"])
@requires_team_member_auth
def submit_for_approval_proposal(proposal_id):
    try:
        g.current_proposal.submit_for_approval()
    except ValidationException as e:
        return {"message": "{}".format(str(e))}, 400
    db.session.add(g.current_proposal)
    db.session.commit()
    return proposal_schema.dump(g.current_proposal), 200


@blueprint.route("/<proposal_id>/publish", methods=["PUT"])
@requires_team_member_auth
def publish_proposal(proposal_id):
    try:
        g.current_proposal.publish()
    except ValidationException as e:
        return {"message": "{}".format(str(e))}, 400
    db.session.add(g.current_proposal)
    db.session.commit()
    return proposal_schema.dump(g.current_proposal), 200


@blueprint.route("/<proposal_id>/updates", methods=["GET"])
def get_proposal_updates(proposal_id):
    proposal = Proposal.query.filter_by(id=proposal_id).first()
    if proposal:
        dumped_proposal = proposal_schema.dump(proposal)
        return dumped_proposal["updates"]
    else:
        return {"message": "No proposal matching id"}, 404


@blueprint.route("/<proposal_id>/updates/<update_id>", methods=["GET"])
def get_proposal_update(proposal_id, update_id):
    proposal = Proposal.query.filter_by(id=proposal_id).first()
    if proposal:
        update = ProposalUpdate.query.filter_by(proposal_id=proposal.id, id=update_id).first()
        if update:
            return proposal_update_schema.dump(update)
        else:
            return {"message": "No update matching id"}
    else:
        return {"message": "No proposal matching id"}, 404


proposal_updates_POST_args = {
    "title": fields.Str(required=True),
    "content": fields.Str(required=True)
}


@blueprint.route("/<proposal_id>/updates", methods=["POST"])
@requires_team_member_auth
@use_args(proposal_updates_POST_args)
def post_proposal_update(args, proposal_id):
    title = args.get("title")
    content = args.get("content")
    update = ProposalUpdate(
        proposal_id=g.current_proposal.id,
        title=title,
        content=content
    )
    db.session.add(update)
    db.session.commit()

    # Send email to all contributors (even if contribution failed)
    preview = make_preview(update.content, 200)
    contributions = ProposalContribution.query.filter_by(proposal_id=proposal_id).all()
    for c in contributions:
        send_email(c.user.email_address, 'contribution_update', {
            'proposal': g.current_proposal,
            'proposal_update': update,
            'preview': preview,
            'update_url': make_url(f'/proposals/{proposal_id}?tab=updates&update={update.id}'),
        })

    dumped_update = proposal_update_schema.dump(update)
    return dumped_update, 201


proposal_invite_POST_args = {
    "address": fields.Str(required=True),
}


@blueprint.route("/<proposal_id>/invite", methods=["POST"])
@requires_team_member_auth
@use_args(proposal_invite_POST_args)
def post_proposal_team_invite(args, proposal_id):
    address = args.get("address")
    invite = ProposalTeamInvite(
        proposal_id=proposal_id,
        address=address
    )
    db.session.add(invite)
    db.session.commit()

    # Send email
    # TODO: Move this to some background task / after request action
    email = address
    user = User.get_by_email(email_address=address)
    if user:
        email = user.email_address
    if is_email(email):
        send_email(email, 'team_invite', {
            'user': user,
            'inviter': g.current_user,
            'proposal': g.current_proposal,
            'invite_url': make_url(
                f'/profile/{user.id}?tab=invites' if user else '/auth')
        })

    return proposal_team_invite_schema.dump(invite), 201


@blueprint.route("/<proposal_id>/invite/<id_or_address>", methods=["DELETE"])
@requires_team_member_auth
def delete_proposal_team_invite(proposal_id, id_or_address):
    invite = ProposalTeamInvite.query.filter(
        (ProposalTeamInvite.id == id_or_address) |
        (ProposalTeamInvite.address == id_or_address)
    ).first()
    if not invite:
        return {"message": "No invite found given {}".format(id_or_address)}, 404
    if invite.accepted:
        return {"message": "Cannot delete an invite that has been accepted"}, 403

    db.session.delete(invite)
    db.session.commit()
    return {"message": None}, 202


@blueprint.route("/<proposal_id>/contributions", methods=["GET"])
def get_proposal_contributions(proposal_id):
    proposal = Proposal.query.filter_by(id=proposal_id).first()
    if not proposal:
        return {"message": "No proposal matching id"}, 404

    top_contributions = ProposalContribution.query \
        .filter_by(
        proposal_id=proposal_id,
        status=ContributionStatus.CONFIRMED,
    ) \
        .order_by(ProposalContribution.amount.desc()) \
        .limit(5) \
        .all()
    latest_contributions = ProposalContribution.query \
        .filter_by(
        proposal_id=proposal_id,
        status=ContributionStatus.CONFIRMED,
    ) \
        .order_by(ProposalContribution.date_created.desc()) \
        .limit(5) \
        .all()

    return {
        'top': proposal_proposal_contributions_schema.dump(top_contributions),
        'latest': proposal_proposal_contributions_schema.dump(latest_contributions),
    }


@blueprint.route("/<proposal_id>/contributions/<contribution_id>", methods=["GET"])
def get_proposal_contribution(proposal_id, contribution_id):
    proposal = Proposal.query.filter_by(id=proposal_id).first()
    if proposal:
        contribution = ProposalContribution.query.filter_by(id=contribution_id).first()
        if contribution:
            return proposal_contribution_schema.dump(contribution)
        else:
            return {"message": "No contribution matching id"}
    else:
        return {"message": "No proposal matching id"}, 404


proposal_contributions_POST_args = {
    "amount": fields.Str(required=True),
}


@blueprint.route("/<proposal_id>/contributions", methods=["POST"])
@requires_auth
@use_args(proposal_contributions_POST_args)
def post_proposal_contribution(args, proposal_id):
    amount = args.get("amount")
    proposal = Proposal.query.filter_by(id=proposal_id).first()
    if not proposal:
        return {"message": "No proposal matching id"}, 404

    code = 200
    contribution = ProposalContribution \
        .get_existing_contribution(g.current_user.id, proposal_id, amount)

    if not contribution:
        code = 201
        contribution = ProposalContribution(
            proposal_id=proposal_id,
            user_id=g.current_user.id,
            amount=amount
        )
        db.session.add(contribution)
        db.session.commit()

    dumped_contribution = proposal_contribution_schema.dump(contribution)
    return dumped_contribution, code


proposal_contributions_confirm_POST_args = {
    "to": fields.Str(required=True),
    "amount": fields.Str(required=True),
    "txid": fields.Str(required=True),
}


# Can't use <proposal_id> since webhook doesn't know proposal id
@blueprint.route("/contribution/<contribution_id>/confirm", methods=["POST"])
@internal_webhook
@use_args(proposal_contributions_confirm_POST_args)
def post_contribution_confirmation(args, contribution_id):
    to = args.get("to")
    amount = args.get("amount")
    txid = args.get("txid")
    contribution = ProposalContribution.query.filter_by(
        id=contribution_id).first()

    if not contribution:
        # TODO: Log in sentry
        print(f'Unknown contribution {contribution_id} confirmed with txid {txid}')
        return {"message": "No contribution matching id"}, 404

    if contribution.status == ContributionStatus.CONFIRMED:
        # Duplicates can happen, just return ok
        return {"message": None}, 200

    # Convert to whole zcash coins from zats
    zec_amount = str(from_zat(int(amount)))

    contribution.confirm(tx_id=txid, amount=zec_amount)
    db.session.add(contribution)
    db.session.commit()

    # Send to the user
    send_email(contribution.user.email_address, 'contribution_confirmed', {
        'contribution': contribution,
        'proposal': contribution.proposal,
        'tx_explorer_url': f'{EXPLORER_URL}transactions/{txid}',
    })

    # Send to the full proposal gang
    for member in contribution.proposal.team:
        send_email(member.email_address, 'proposal_contribution', {
            'proposal': contribution.proposal,
            'contribution': contribution,
            'contributor': contribution.user,
            'funded': contribution.proposal.funded,
            'proposal_url': make_url(f'/proposals/{contribution.proposal.id}'),
            'contributor_url': make_url(f'/profile/{contribution.user.id}'),
        })

    # TODO: Once we have a task queuer in place, queue emails to everyone
    # on funding target reached. 

    return {"message": None}, 200


@blueprint.route("/contribution/<contribution_id>", methods=["DELETE"])
@requires_auth
def delete_proposal_contribution(contribution_id):
    contribution = contribution = ProposalContribution.query.filter_by(
        id=contribution_id).first()
    if not contribution:
        return {"message": "No contribution matching id"}, 404

    if contribution.status == ContributionStatus.CONFIRMED:
        return {"message": "Cannot delete confirmed contributions"}, 400

    if contribution.user_id != g.current_user.id:
        return {"message": "Must be the user of the contribution to delete it"}, 403

    contribution.status = ContributionStatus.DELETED
    db.session.add(contribution)
    db.session.commit()
    return {"message": None}, 202
