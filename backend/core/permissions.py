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
        """
        Allows object-level access to 'gerente' users. This grants them
        permission to perform actions like view, update, and delete.
        """
        # Delegates object-level permission to the view-level permission check,
        # which already confirms if the user is an authenticated 'gerente'.
        return self.has_permission(request, view)


class LoggingPermission(permissions.BasePermission):
    """
    Custom permission to log request details for debugging.
    """

    def has_permission(self, request, view):
        print("\n--- [LoggingPermission: has_permission] ---")
        print(f"Request User: {request.user}")
        print(f"Is Authenticated: {request.user.is_authenticated}")
        if hasattr(request.user, 'nivel_acesso'):
            print(f"User Nivel Acesso: {request.user.nivel_acesso}")
        else:
            print("User has no 'nivel_acesso' attribute.")
        print(f"Request Auth: {request.auth}")
        print(f"Request Method: {request.method}")
        print("View: ", view.__class__.__name__)
        print("-----------------------------------------\n")
        return True # Always allow to see if the view is reached

    def has_object_permission(self, request, view, obj):
        print("\n--- [LoggingPermission: has_object_permission] ---")
        print(f"Request User: {request.user}")
        print(f"Is Authenticated: {request.user.is_authenticated}")
        if hasattr(request.user, 'nivel_acesso'):
            print(f"User Nivel Acesso: {request.user.nivel_acesso}")
        else:
            print("User has no 'nivel_acesso' attribute.")
        print(f"Request Auth: {request.auth}")
        print(f"Request Method: {request.method}")
        print("View: ", view.__class__.__name__)
        print("Object: ", obj)
        print("---------------------------------------------\n")
        return True # Always allow
