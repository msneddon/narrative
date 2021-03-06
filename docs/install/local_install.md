## Installing the Narrative Interface

### Requirements

* Python > 2.7
* Python's virtualenv package
* NodeJS
* Bower

1. Install the JavaScript dependencies with Bower, from the root of this repo.
```
bower install
```

2. Create a virtual environment with virtualenv. This creates a directory that encapsulates a complete environment that is separate from others on your system, and protects your system from module and version conflicts.
```
pip install virtualenv --upgrade   # vanilla Ubuntu 14.04 images come with a very old version of virtualenv that might be problematic
virtualenv my_narrative_venv
```

3. Activate that environment
```
source my_narrative_venv/bin/activate
```

4. Run the installation script. With your virtual environment activated, any dependencies will be installed there. This'll take ~450MB in your virtualenv.
```
sh scripts/install_narrative.sh
```

5. With your virtualenv still active, you can now run the Narrative. This will automatically open a browser window and run the Narrative inside of it.
```
kbase-narrative
```
