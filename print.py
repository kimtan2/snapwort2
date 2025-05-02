import os

def gather_code(root_folder, output_file):
    # Open the output file in write mode
    with open(output_file, 'w', encoding='utf-8') as all_code:
        # Traverse through all files in the app folder within the root folder
        app_folder = os.path.join(root_folder, 'app')
        for foldername, subfolders, filenames in os.walk(app_folder):
            for filename in filenames:
                # Check for .ts or .tsx extensions
                if filename.endswith('.ts') or filename.endswith('.tsx'):
                    file_path = os.path.join(foldername, filename)
                    
                    try:
                        # Read the file content
                        with open(file_path, 'r', encoding='utf-8') as file:
                            content = file.read()
                        
                        # Write the file information and content to the output file
                        all_code.write(f"File Name: {filename}\n")
                        all_code.write(f"Location: {file_path}\n")
                        all_code.write(f"Content:\n{content}\n")
                        all_code.write("\n" + "-" * 80 + "\n")  # Separator between files

                    except Exception as e:
                        print(f"Error reading {file_path}: {e}")

if __name__ == "__main__":
    root_folder = '.'  # Specify the root folder (current folder by default)
    output_file = 'allCode.txt'  # Output file name

    gather_code(root_folder, output_file)
    print(f"Code from all .ts and .tsx files has been written to {output_file}")
