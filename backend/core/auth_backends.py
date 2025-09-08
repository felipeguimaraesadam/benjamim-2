from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class CustomAuthBackend(ModelBackend):
    """
    Backend de autenticação personalizado para o modelo Usuario.
    Permite autenticação usando o campo 'login' como username.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get('login')
        
        if username is None or password is None:
            return None
            
        try:
            # Buscar usuário pelo campo login
            user = User.objects.get(login=username)
        except User.DoesNotExist:
            # Executar hash de senha mesmo se usuário não existir (segurança)
            User().set_password(password)
            return None
        
        # Verificar senha e se usuário está ativo
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        
        return None
    
    def get_user(self, user_id):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
        return user if self.user_can_authenticate(user) else None