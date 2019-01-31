from datetime import datetime

from flask import Blueprint, jsonify
from grant.task.jobs import JOBS
from grant.task.models import Task, tasks_schema
# from webargs import fields, validate
# from webargs.flaskparser import use_args

blueprint = Blueprint("task", __name__, url_prefix="/api/v1/task")

# user_args = {
#     # Required arguments
#     "username": fields.Str(required=True),
#     "password": fields.Str(validate=validate.Length(min=6)),
#
# }
#
#
# @blueprint.route("/example", methods=["POST"])
# @use_args(user_args)
# def example(args):
#     username = args["username"]
#     password = args["password"]
#     return {"user_name": username, "password": password}


@blueprint.route("/", methods=["GET"])
def task():
    tasks = Task.query.filter(Task.execute_after <= datetime.now()).filter_by(completed=False).all()
    for each_task in tasks:
        try:
            JOBS[each_task.job_type](each_task)
        except Exception as e:
            # replace with Sentry logging
            print("Oops, something went wrong: {}".format(e))
    return jsonify(tasks_schema.dump(tasks))
