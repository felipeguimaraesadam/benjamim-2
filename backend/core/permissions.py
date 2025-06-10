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
