function default_string( value , def )
{
    if ( value == undefined )
        return def;
    return value;
}
function render_entry( entry , stats )
{
    var status = "";
    var count = 0;
    if (entry.patients != undefined ) {
        entry.patients.forEach(function(patient){
            var color = "white";
            if ( patient.count == undefined )
                patient.count = 1;

            if ( patient.status === "deceased" )
            {
                color = "red";
                stats.deceased += patient.count;
                stats.positive += patient.count;
            }
            else if ( patient.status === "deceased-suspected" )
            {
                color = "orange";
            }
            else if ( patient.status === "positive" )
            {
                color = "red";
                stats.positive += patient.count;
            }
            else if ( patient.status === "negative" || patient.status === "cleared" || patient.status === "ruled-out" || patient.status === "presumed-negative" || patient.status === "deceased-negative" )
            {
                color = "green";
                stats.negative += patient.count;
            }
            else if ( patient.status === "quarantined" )
            {
                color = "white";
                stats.quarantined += patient.count;
            }

            count += patient.count;
            stats.total += patient.count;
            status += "<span style='white-space: nowrap;color: "+color+"'>";
            status += patient.count + " ";
            status += patient.status
            status += "</span><br/>";
        }); }

    if (entry.patients_nostats != undefined ) {
        entry.patients_nostats.forEach(function(patient){
            var color = "white";
            if ( patient.count == undefined )
                patient.count = 1;

            if ( patient.status === "deceased" )
            {
                color = "orange";
            }
            else if ( patient.status === "deceased-suspected" )
            {
                color = "orange";
            }
            else if ( patient.status === "positive" )
            {
                color = "red";
            }
            else if ( patient.status === "negative" || patient.status === "cleared" || patient.status === "ruled-out" || patient.status === "presumed-negative" || patient.status === "deceased-negative" )
            {
                color = "green";
            }
            else if ( patient.status === "quarantined" )
            {
                color = "white";
            }

            status += "<span style='white-space: nowrap;color: "+color+"'>";
            status += patient.count + " ";
            status += patient.status + "†";
            status += "</span><br/>";
        }); }

    var links = "";
    var linkCount = 0;
    entry.links.forEach(function(link){
        links += "<a href='" + link + "'>["+ (++linkCount) + "]</a> ";
    });

    var result = "<tr>";
    result += "<td>" + entry.location + "</td>";
    result += "<td>" + count + "</td>";
    result += "<td>" + status + "</td>";
    result += "<td>" + links + "</td>";
    result += "<td>" + entry.date + "</td>";
    result += "<td>" + default_string(entry.notes, "") + "</td>";
    result += "</tr>";
    var date = new Date(entry.date);
    if (stats.previousDate != 0) {
        elapsedTime = Math.abs(date.getTime() - stats.previousDate.getTime());
        stats.total_intervals += elapsedTime;
    }
    stats.previousDate = date;
    return result;
}

function render( list )
{
    result = "<tbody>";
    result += "<tr>";
    result += "<th>Location</th>";
    result += "<th>#</th>";
    result += "<th>Outcome</th>";
    result += "<th>Sources</th>";
    result += "<th>Date</th>";
    result += "<th>Comments</th>";
    result += "</tr>";

    var stats = { "total" : 0 , "deceased" : 0 , "positive" : 0, "quarantined" : 0 , "negative" : 0 , "total_intervals" : 0 , "previousDate" : 0 };
    var incidents = 0;


    list.forEach(function(entry) {
        result += render_entry(entry, stats);
    });

    result += "</tbody>";

    var statsHtml = "<tbody>";
    statsHtml += "<tr><td>Total Patients:</td><td style='color:orange'>" + stats.total + "</td></tr>";
    statsHtml += "<tr><td>Deceased:</td><td style='color:orange'>" + stats.deceased + "</td></tr>";
    statsHtml += "<tr><td>Positive:</td><td style='color:red'>" + stats.positive + "</td></tr>";
    statsHtml += "<tr><td>Negative:</td><td style='color:green'>" + stats.negative + "</td></tr>";
    statsHtml += "<tr><td>Quarantined:</td><td style='color:white'>" + stats.quarantined + "</td></tr>";
    statsHtml += "<tr><td>False Alarm Rate:</td><td>" + stats.negative + ":" + stats.total + " (" + (100*stats.negative / stats.total).toPrecision(3) + "%)</td></tr>";
    statsHtml += "<tr><td>Mortality Rate:</td><td>" + stats.deceased + ":" + stats.positive + " (" + (100*stats.deceased / stats.positive).toPrecision(3) + "%)</td></tr>";
    statsHtml += "<tr><td>Average Interval Between incidents:</td><td>" + (stats.total_intervals / ( stats.total * 1000 * 3600 * 24)).toPrecision(2) + " days</td></tr>"; // 1000 ms, 3600 sec/hr, 24 hr/day
    statsHtml +=  "</tbody>";


    var ebolaList = document.getElementById("ebola-list");
    ebolaList.innerHTML = result;

    var statistics = document.getElementById("statistics");
    statistics.innerHTML = statsHtml;
}

function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {

        // Check if the XMLHttpRequest object has a "withCredentials" property.
        // "withCredentials" only exists on XMLHTTPRequest2 objects.
        xhr.open(method, url, true);

    } else if (typeof XDomainRequest != "undefined") {

        // Otherwise, check if XDomainRequest.
        // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
        xhr = new XDomainRequest();
        xhr.open(method, url);

    } else {

        // Otherwise, CORS is not supported by the browser.
        xhr = null;

    }
    return xhr;
}

var xhr = createCORSRequest('GET', "http://ebola.thenewentity.com/ebola.json");

xhr.onreadystatechange = function()
{
    if (xhr.readyState == 4 )
    {
        var list = JSON.parse(xhr.responseText);
        // sort list, most recent first.
        list.sort(function(a,b)
                  {
                      if (a.date < b.date) return 1;
                      if (a.date > b.date) return -1;
                      return 0;
                  });
        render(list);
    }
};
xhr.send(null);
