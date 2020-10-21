import { h } from "preact";

var apMonths = [
  "Jan.",
  "Feb.",
  "March",
  "April",
  "May",
  "June",
  "July",
  "Aug.",
  "Sept.",
  "Oct.",
  "Nov.",
  "Dec."
];

export default function DateFormatter(props) {
  var dateString = "...";

  if (props.value) {
    var date = new Date(props.value);
    var hours = date.getHours();
    if (!isNaN(hours)) { 
      var suffix = hours < 12 ? "AM" : "PM";
      if (!hours) {
        hours = 12;
      } else if (hours > 12) {
        hours -= 12;
      }
      var minutes = date.getMinutes().toString().padStart(2, "0");
      var month = apMonths[date.getMonth()];
      var day = date.getDate();
      var year = date.getFullYear();
      dateString = `${hours}:${minutes} ${suffix} on ${month} ${day}, ${year}`;
    }
  }
  return <span class="formatted-date">
    {dateString}
  </span>
}
