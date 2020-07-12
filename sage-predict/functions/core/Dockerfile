FROM python:3.7-slim as base

RUN python -m pip install --no-cache -I scikit-learn==0.23.1
RUN python -m pip install --no-cache -I joblib
RUN python -m pip install --no-cache -I boto3

# Create directory for models
RUN mkdir -p /app
RUN chmod +rwx /app

COPY . /app/

CMD ["/app/predict.py"]
ENTRYPOINT ["python"]

