from locust import HttpLocust, TaskSet

def index(l):
    l.client.get("/lambda/newton")

class UserBehavior(TaskSet):
    tasks = {index: 2}

class WebsiteUser(HttpLocust):
    task_set = UserBehavior