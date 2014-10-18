function default_string( value , def )
{
    if ( value == undefined )
        return def;
    return value;
}

function isSuspected( status ) 
{
    return ( status === "quarantined" || status == "released-suspected" ); 
}

function isNegative( status )
{
    return ( status === "negative" || status === "cleared" || status === "ruled-out" || status === "presumed-negative" || status === "deceased-negative" );
}

function isPositive( status )
{
    return ( status === "positive" ) || (status === "deceased");
}

function isDeceased( status )
{
    return ( status === "deceased" || status === "deceased-negative" || status === "deceased-suspected" );
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

            if ( patient.status === "deceased-suspected" )
            {
                color = "orange";
            }
            else if ( isPositive( patient.status ) )
            {
                color = "red";
                stats.positive += patient.count;
                if ( isDeceased( patient.status ) )
                    stats.deceased += patient.count;
            }
            else if ( isNegative( patient.status ) )
            {
                color = "green";
                stats.negative += patient.count;
            }
            else if ( isSuspected( patient.status ) )
            {
                color = "white";
                stats.suspected += patient.count;
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
            else if ( isNegative( patient.status ) )
            {
                color = "green";
            }
            else if ( isSuspected( patient.status ) )
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

    var stats = { "total" : 0 , "deceased" : 0 , "positive" : 0, "suspected" : 0 , "negative" : 0 , "total_intervals" : 0 , "previousDate" : 0 };
    var incidents = 0;


    list.forEach(function(entry) {
        result += render_entry(entry, stats);
    });

    result += "</tbody>";

    var maxDate = (new Date(list[0].date)).getTime();
    var minDate = (new Date(list[list.length-1].date)).getTime();
    var dateDiff = maxDate - minDate;
    dateDiff = dateDiff / ( 1000 * 3600 * 24 );
    console.log( "dateDiff: " + dateDiff );

    var statsHtml = "<tbody>";
    statsHtml += "<tr><td>Total Patients:</td><td style='color:orange'>" + stats.total + "</td></tr>";
    statsHtml += "<tr><td>Deceased:</td><td style='color:orange'>" + stats.deceased + "</td></tr>";
    statsHtml += "<tr><td>Positive:</td><td style='color:red'>" + stats.positive + "</td></tr>";
    statsHtml += "<tr><td>Negative:</td><td style='color:green'>" + stats.negative + "</td></tr>";
    statsHtml += "<tr><td>Suspected:</td><td style='color:white'>" + stats.suspected + "</td></tr>";
    statsHtml += "<tr><td>False Alarm Rate:</td><td>" + stats.negative + ":" + stats.total + " (" + (100*stats.negative / stats.total).toPrecision(3) + "%)</td></tr>";
    statsHtml += "<tr><td>Mortality Rate:</td><td>" + stats.deceased + ":" + stats.positive + " (" + (100*stats.deceased / stats.positive).toPrecision(3) + "%)</td></tr>";
    statsHtml += "<tr><td>Average Interval Between incidents:</td><td>" + (stats.total_intervals / ( stats.total * 1000 * 3600 * 24)).toPrecision(2) + " days</td></tr>"; // 1000 ms, 3600 sec/hr, 24 hr/day
    statsHtml += "<tr><td>Average incidents per day:</td><td>" + (stats.total /  dateDiff ).toPrecision(2) + " incidents/day</td></tr>"; // 1000 ms/s, 3600 sec/hr, 24 hr/day
    statsHtml +=  "</tbody>";



    var ebolaList = document.getElementById("ebola-list");
    ebolaList.innerHTML = result;

    var statistics = document.getElementById("statistics");
    statistics.innerHTML = statsHtml;
}

function renderGraph(list) {
    var canvas = document.getElementById('ebola-chart');
    if (canvas === undefined || canvas === null)
        return;
    var context = canvas.getContext('2d');

    var maxDate = (new Date(list[0].date)).getTime();
    var minDate = (new Date(list[list.length-1].date)).getTime();
    var dateDiff = maxDate - minDate;
    var maxX = context.canvas.width;

    context.beginPath();
    context.lineWidth = 5;
    context.strokeStyle="orange";
    context.moveTo( 0, context.canvas.height );
    var y = context.canvas.height;

    list.reverse().forEach(function(entry) {
        var date = (new Date(entry.date)).getTime() - minDate;
        var x = Math.floor( ( date / dateDiff ) * maxX );
        if ( entry.patients === undefined )
            return;

        entry.patients.forEach(function(entry) {
            y -= entry.count;
        });
        context.lineTo(x,y);
    });
    context.stroke();

    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle="green";
    context.moveTo( 0, context.canvas.height );
    var y = context.canvas.height;

    list.forEach(function(entry) {
        var date = (new Date(entry.date)).getTime() - minDate;
        var x = Math.floor( ( date / dateDiff ) * maxX );
        if ( entry.patients === undefined )
            return;

        entry.patients.forEach(function(entry) {
            if ( isNegative( entry.status ) )
                y -= entry.count;
        });
        context.lineTo(x,y);
    });
    context.stroke();

    context.beginPath();
    context.strokeStyle="white";
    var y = context.canvas.height;

    list.forEach(function(entry) {
        var date = (new Date(entry.date)).getTime() - minDate;
        var x = Math.floor( ( date / dateDiff ) * maxX );
        if ( entry.patients === undefined )
            return;

        entry.patients.forEach(function(entry) {
            if ( isSuspected( entry.status ) )
                y -= entry.count;
        });
        if ( y == context.canvas.height ) {
            context.moveTo( x, context.canvas.height );
        } else {            
            context.lineTo(x,y);
        }
    });
    context.stroke();

    context.beginPath();
    context.strokeStyle="red";
    var y = context.canvas.height;

    list.forEach(function(entry) {
        var date = (new Date(entry.date)).getTime() - minDate;
        var x = Math.floor( ( date / dateDiff ) * maxX );
        if ( entry.patients === undefined )
            return;

        entry.patients.forEach(function(entry) {
            if ( isPositive( entry.status ) )
                y -= entry.count;
        });
        if ( y == context.canvas.height ) {
            context.moveTo( x, context.canvas.height );
        } else {            
            context.lineTo(x,y);
        }
    });
    context.stroke();


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

var url = "http://ebola.thenewentity.com/ebola.json";
if ( window.location.protocol == "file:" )
    url = "ebola.json";
var xhr = createCORSRequest('GET', url );

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
        renderGraph(list);
    }
};
xhr.send(null);
