FROM php:7.4.3-apache
RUN docker-php-ext-install mysqli pdo pdo_mysql
COPY ./app/ /var/www/html/
COPY ./localhost+1.pem /etc/apache2/certs/server.crt
COPY ./localhost+1-key.pem /etc/apache2/certs/server.key
COPY ./apache.conf /etc/apache2/conf-available/ssl.conf



RUN chown -R www-data:www-data /var/www/html && a2enmod ssl && a2enconf ssl
EXPOSE 80 443
