import shutil
import time
import os
import posixpath
import subprocess

MINUTES = 60;

while True:
  now = time.strftime("%H_%M_%S")
  os.system("grunt ap --test")
  files = os.listdir("temp")
  json = [f for f in files if ("json" in f)]
  folder = posixpath.join("temp/timed", now)
  os.makedirs(folder, exist_ok=True)
  for f in json:
    src = posixpath.join("temp", f)
    dest = posixpath.join(folder, f)
    shutil.copyfile(src, dest)
    print(dest)
  time.sleep(10 * MINUTES)