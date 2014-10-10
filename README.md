This repository represents some tools I've set up to manage my article <a href='http://burlyearly.blogspot.com/2014/08/ebola-outside-hot-zone.html'>Ebola Outside
the HotZone</a>

The main piece is ebola.json, which is a JSON array of entities following this pattern:

```JSON
    {
      "location" : "Somewhere",
      "patients" :
      [
          { "status" : "STATUS" , "count" : 42 },
          { "status" : "other-status" , "count" : 32 }
      ],
      "links" : [ "Some-URL" , "Some-Other-URL" ],
      "date" : "Date, in ISO format: YYYY-MM-DD"
    }
```

Dates are for the date of the oldest link referencing the case.
