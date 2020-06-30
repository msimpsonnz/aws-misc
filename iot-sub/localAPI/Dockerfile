FROM python:3.7-slim as runtime
COPY pip.conf /etc/pip.conf
RUN pip3 install awscrt
RUN pip3 install awsiotsdk
RUN pip3 install Flask
RUN pip3 install future
COPY . /app
WORKDIR /app

ENTRYPOINT ["python"]
CMD ["app.py"]