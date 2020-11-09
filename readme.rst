elections20-interactive
======================================================

This news app is built on our `interactive template <https://github.com/nprapps/interactive-template>`_. Check the readme for that template for more details about the structure and mechanics of the app, as well as how to start your own project.

Getting started
---------------

To run this project you will need:

* Node installed (preferably with NVM or another version manager)
* The Grunt CLI (install globally with ``npm i -g grunt-cli``)
* Git

With those installed, you can then set the project up using your terminal:

#. Pull the code - ``git clone git@github.com:nprapps/elections20-interactive``
#. Enter the project folder - ``cd elections20-interactive``
#. Install dependencies from NPM - ``npm install``
#. Start the server - ``grunt``

Running tasks
-------------

Like all interactive-template projects, this application uses the Grunt task runner to handle various build steps and deployment processes. To see all tasks available, run ``grunt --help``. ``grunt`` by itself will run the "default" task, which processes data and starts the development server. However, you can also specify a list of steps as arguments to Grunt, and it will run those in sequence. For example, you can just update the JavaScript and CSS assets in the build folder by using ``grunt bundle less``.

Common tasks that you may want to run include:

* ``sheets`` - updates local data from Google Sheets
* ``docs`` - updates local data from Google Docs
* ``google-auth`` - authenticates your account against Google for private files
* ``static`` - rebuilds files but doesn't start the dev server
* ``cron`` - runs builds and deploys on a timer (see ``tasks/cron.js`` for details)
* ``publish`` - uploads files to the staging S3 bucket

  * ``publish:live`` uploads to production
  * ``publish:simulated`` does a dry run of uploaded files and their compressed sizes

Tracked events
--------------

* ``route`` - sends the URL fragment as the event label
* ``county-metric`` - the county table's custom metric was updated
* ``county-sort`` - the user clicked a header to re-sort a county table
* ``clicked-bubble`` - the user clicked a bubble on the margin plot
* ``clicked-cartogram`` - the user clicked a state on the cartogram
* ``clicked-map`` - the user clicked a state on the national map
* ``tab-selected`` - the user manually chose a tab to view

Additional links and params
--------------

* Homepage embed: ``/homepage.html``
   
  * ``display=margins,cartogram,map`` controls which viz displays on load
   
* Balance of Power embed (House and Senate bars): ``/embedBOP.html``

  * ``president=true`` adds electoral totals to the top (for use on homepage)
  * ``hideCongress=true`` hides House and Senate bars on mobile view
  * ``onlyPresident=true`` hides House and Senate bars on all views
  * ``inline=true`` for side-by-side display (for use on liveblog)
  * ``theme=dark`` for dark theme
    
* Internal ballot initiative board: ``/#/ballots``
* Results embed customizer: ``/customizer.html``
* Share pages, with metadata for social cards

  * ``/share/XX.html`` - state pages, where XX is the postal code
  * ``/share/president.html`` - Presidential big board
  * ``/share/senate.html`` - Senate big board
  * ``/share/house.html`` - House big board
  * ``/share/governor.html`` - Governors big board

Troubleshooting
---------------

**Fatal error: Port 35729 is already in use by another process.**

The live reload port is shared between this and other applications. If you're running another interactive-template project or Dailygraphics Next, they may collide. If that's the case, use ``--reload-port=XXXXX`` to set a different port for the live reload server. You can also specify a port for the webserver with ``--port=XXXX``, although the app will automatically find the first available port after 8000 for you.
