from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("recvizapi/", include("recvizapi.urls")),
    path('admin/', admin.site.urls),
]
