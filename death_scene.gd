extends Control

@export_global_file(" ") var next_scene_path

@export var player_spawn_location = Vector2(200,150)
@export var player_direction_facing = Vector2(0,0)

# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	pass # Replace with function body.


# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta: float) -> void:
	pass


func _on_play_pressed() -> void:
	pass # Replace with function body.


func _on_play_again_pressed() -> void:
	get_tree().change_scene_to_file("res://Scenes/main.tscn")
	DialogueManager.update_health(+10)
	
