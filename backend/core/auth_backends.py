from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password
from .models import Usuario

class CustomUsuarioAuthBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # 'username' here is what's passed from login forms/requests,
            # which corresponds to our 'login' field in Usuario model.
            user = Usuario.objects.get(login=username)
            if check_password(password, user.senha_hash):
                return user
        except Usuario.DoesNotExist:
            return None
        return None

    def get_user(self, user_id):
        try:
            return Usuario.objects.get(pk=user_id)
        except Usuario.DoesNotExist:
            return None
