from rest_framework import permissions

class IsNivelAdmin(permissions.BasePermission):
    """
    Custom permission to only allow users with nivel_acesso 'admin'.
    """

    def has_permission(self, request, view):
        # Check if the user is authenticated and has 'admin' access level
        return request.user and request.user.is_authenticated and request.user.nivel_acesso == 'admin'

    def has_object_permission(self, request, view, obj):
        # Permissions are typically checked at the view level for list/create,
        # and can be refined here for object-specific actions if needed.
        # For simplicity, if a user has 'admin' access, they can affect any user object.
        return request.user and request.user.is_authenticated and request.user.nivel_acesso == 'admin'


class IsNivelGerente(permissions.BasePermission):
    """
    Custom permission to only allow users with nivel_acesso 'gerente'.
    """

    def has_permission(self, request, view):
        # Check if the user is authenticated and has 'gerente' access level
        return request.user and request.user.is_authenticated and request.user.nivel_acesso == 'gerente'

    def has_object_permission(self, request, view, obj):
        # Allow 'retrieve' (view) actions for 'gerente'
        if view.action == 'retrieve':
            return request.user and request.user.is_authenticated and request.user.nivel_acesso == 'gerente'
        # Disallow 'update', 'partial_update', and 'destroy' actions for 'gerente'
        elif view.action in ['update', 'partial_update', 'destroy']:
            return False
        # For other actions, rely on has_permission or deny by default
        return False
