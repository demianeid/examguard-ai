"""
Custom SMTP email backend for Django on Windows.

Django's default SMTP backend raises:
  [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed:
  Basic Constraints of CA cert not marked critical

This backend overrides open() to inject a permissive SSL context into
the STARTTLS call, which is the only reliable fix on Windows where
Python's ssl module ignores the SSL_CERT_FILE environment variable.
"""

import ssl
import smtplib
import certifi
from django.core.mail.backends.smtp import EmailBackend as DjangoSmtpBackend


class CertifiEmailBackend(DjangoSmtpBackend):
    """
    Drop-in replacement for Django's SMTP backend.
    Bypasses the strict Windows SSL certificate chain validation.
    """

    def open(self):
        if self.connection:
            return False

        # Build a permissive SSL context using certifi's CA bundle
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        try:
            # Always use plain smtplib.SMTP (STARTTLS on port 587)
            self.connection = smtplib.SMTP(
                self.host,
                self.port,
                timeout=self.timeout if self.timeout is not None else 30,
            )

            if self.use_tls:
                self.connection.ehlo()
                self.connection.starttls(context=ssl_context)
                self.connection.ehlo()

            if self.username and self.password:
                self.connection.login(self.username, self.password)

            return True

        except Exception:
            if not self.fail_silently:
                raise
            return False
