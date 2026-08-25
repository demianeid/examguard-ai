from django.urls import path
from . import views

urlpatterns = [
    # Stream
    path('cameras/<int:camera_id>/start/', views.start_stream,         name='start-stream'),
    path('streams/<int:session_id>/stop/', views.stop_stream,          name='stop-stream'),
    path('streams/<int:session_id>/update/', views.update_stream_status, name='update-stream'),

    # Get Streams
    path('halls/<int:hall_id>/streams/', views.get_hall_streams,  name='hall-streams'),
    path('streams/active/',              views.get_active_streams, name='active-streams'),
]