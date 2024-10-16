input_mp3_file="$1"

# Define the output directory and ensure it exists
output_directory="../uploads"
mkdir -p "$output_directory"

# Extract the base name of the input file and define the output wav file path
base_name=$(basename "$input_mp3_file" .mp3)
output_wav_file="$output_directory/${base_name}.pcm"

# Convert mp3 to wav using FFmpeg
ffmpeg -y -i "$input_mp3_file" -acodec pcm_s16le -f s16le -ac 1 -ar 16000 "$output_wav_file"

if [ $? -eq 0 ]; then
  echo "Conversion successful: $output_wav_file"
else
  echo "Failed to convert mp3 to wav."
  exit 1
fi