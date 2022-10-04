conda create --name conda-far
conda-forge python=3.9 gdal numpy matplotlib pandas patsy pip statsmodels earthengine-api --yes
conda activate conda-far
pip install pywdpa sklearn # Packages not available with conda
pip install forestatrisk # For PyPI version
# pip install https://github.com/ghislainv/forestatrisk/archive/master.zip # For GitHub dev version
# conda install -c conda-forge python-dotenv rclone --yes  # Potentially interesting libraries