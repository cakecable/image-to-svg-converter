extends Node2D

@onready var label: Label = $Label

var is_player_near = false

var dialog_text = "Can I have a pepperoni pizza please?"

func _ready():
	label.visible = false

func _on_body_entered(body):
	if body.name == "Player":
		label.visible = true
		is_player_near = true

func _on_body_exited(body):
	if body.name == "Player":
		label.visible = false
		is_player_near = false

func interact():
	print(dialog_text)
	play_audio()

func play_audio():
	var audio_player = AudioStreamPlayer.new()
	audio_player.stream = dialog_audio
	add_child(audio_player)
	audio_player.play()
