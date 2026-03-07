from django.urls import path
from .views import (
    StudentRegisterView,
    ProfessorRegisterView,
    LoginView,
    ForgetPasswordView,
    VerifyOtpView,
    ResetPasswordView,
)
from . import profile_views 

urlpatterns = [
    # Auth URLs
    path('register/student/', StudentRegisterView.as_view(), name='student-register'),
    path('register/professor/', ProfessorRegisterView.as_view(), name='professor-register'),
    path('login/', LoginView.as_view(), name='login'),
    path('forget-password/', ForgetPasswordView.as_view(), name='forget-password'),
    path('verify-otp/', VerifyOtpView.as_view(), name='verify-otp'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    
    # Profile URLs
    path('profile/', profile_views.GetProfileView.as_view(), name='get-profile'),
    path('profile/update/', profile_views.UpdateProfileView.as_view(), name='update-profile'),
    path('change-password/', profile_views.ChangePasswordView.as_view(), name='change-password'),
    path('delete-account/', profile_views.DeleteAccountView.as_view(), name='delete-account'),
]