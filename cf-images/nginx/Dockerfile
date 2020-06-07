FROM nginx
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY ./1.jpg /var/www/
COPY ./index.html /var/www/
EXPOSE 80
CMD ["nginx"]