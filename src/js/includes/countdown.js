const resultsCountdown = function(indicator, loadInterval) {
    var counter = null;
    var interval = null;

    indicator.innerHTML = 'Next update: ';

    var bTag = document.createElement('b');
    bTag.classList.add('icon', 'icon-spin3');

    var spanTag = document.createElement('span');
    spanTag.classList.add('text');

    // bTag.appendChild(spanTag);
    indicator.appendChild(bTag);
    indicator.appendChild(spanTag);

    var indicatorSpinner = indicator.querySelector('.icon');
    var indicatorText = indicator.querySelector('.text');

    var startIndicator = function() {
        indicatorSpinner.classList.remove('animate-spin');
        counter = loadInterval / 1000;
        updateText();
        interval = setInterval(updateIndicator, 1000);
    }

    var updateIndicator = function() {
        counter--;
        updateText();
        if (counter === 0) {
            stopIndicator();
        }
    }

    var stopIndicator = function() {
        clearInterval(interval);
        indicatorSpinner.classList.add('animate-spin');
        indicatorText.textContent = 'Loading';
    }

    var updateText = function() {
        if (counter > 9) {
            indicatorText.textContent = '0:' + counter;
        } else {
            indicatorText.textContent = '0:0' + counter;
        }
    }

    startIndicator();
};

export default resultsCountdown;
