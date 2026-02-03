# City Data

One folder per city. Folder names use **2-letter state abbreviation, dash, then city name** (e.g. `IL-Chicago`, `NY-New-York-City`).

## Folders

| Folder | City |
|--------|------|
| NY-New-York-City | New York City, NY |
| DC-Washington | Washington, DC |
| IL-Chicago | Chicago, IL |
| MA-Boston | Boston, MA |
| PA-Philadelphia | Philadelphia, PA |
| TN-Nashville | Nashville, TN |
| WA-Seattle | Seattle, WA |
| CA-San-Francisco | San Francisco, CA |
| ON-Toronto | Toronto, ON |
| OH-Statewide | Ohio (statewide) |
| OH-Columbus | Columbus, OH |
| VA-Statewide | Virginia (statewide) |
| VA-Richmond | Richmond, VA |
| MD-Montgomery | Montgomery County, MD |

## Adding data

- **Rainfall (.dat):** Put rain time-series files in the city folder (e.g. `Rain - stationid.dat`). Then add the path to `RAINFALL_DAT_FILES` in `index.html` using the folder name, e.g. `city-data/IL-Chicago/Rain - 72530094846.dat`.
- **Temperature (.dat):** Optional; same folder, e.g. `Temp - stationid.dat`.
- **Other:** Use the same folder for any future city-specific files (overview HTML, images, config, etc.).

The app maps city keys (e.g. `chicago`, `nyc`) to these folder names via `CITY_DATA_FOLDER` in `index.html`.
