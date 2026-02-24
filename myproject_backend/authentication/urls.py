from django.urls import path
from .views import (
    StudentRegisterView,
    ProfessorRegisterView,
    LoginView,
    ForgetPasswordView,
    VerifyOtpView,
    ResetPasswordView,
)

urlpatterns = [
    path('register/student/',  StudentRegisterView.as_view(),  name='student-register'),
    path('register/professor/', ProfessorRegisterView.as_view(), name='professor-register'),
    path('login/',             LoginView.as_view(),             name='login'),
    path('forget-password/',   ForgetPasswordView.as_view(),    name='forget-password'),
    path('verify-otp/',        VerifyOtpView.as_view(),         name='verify-otp'),
    path('reset-password/',    ResetPasswordView.as_view(),     name='reset-password'),
]