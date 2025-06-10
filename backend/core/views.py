from rest_framework import viewsets, permissions
from .models import Usuario
from .serializers import UsuarioSerializer
from .permissions import IsNivelAdmin

class UsuarioViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = Usuario.objects.all().order_by('id')
    serializer_class = UsuarioSerializer
    permission_classes = [IsNivelAdmin] # Using custom permission

# Placeholder for other views if any
# from django.shortcuts import render
# Create your views here.
