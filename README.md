# Health Lab VSB - TU Ostrava – Code & Data website

Source of **https://healthlabvsb.github.io** – the public catalogue of code and data from Health Lab VSB – Technical University of Ostrava.

## How to add a publication

Edit [`data/publications.json`](data/publications.json) and add one entry (newest year first is not required – the site sorts automatically):

```json
{
  "id": "surname2026keyword",
  "type": "article",
  "area": "radar",
  "title": "Full title of the paper",
  "authors": ["Surname, Given", "Surname, Given"],
  "venue": "Journal name",
  "year": 2026,
  "volume": "12",
  "number": "345",
  "doi": "10.xxxx/xxxxx",
  "code": "https://github.com/HealthLabVSB/repository-name",
  "data": "https://doi.org/10.5281/zenodo.xxxxxxx"
}
```

- `type`: `article`, `dataset` or `software`
- `area`: one of the area ids in [`data/site.json`](data/site.json) (`radar`, `biosignals`, `blood-pressure`, `medical-imaging`)
- `volume`, `number`, `data`, `related` are optional

Commit the change – the website updates within a minute.

## How repositories appear

The **Public repositories** section is loaded live from GitHub. A public repository shows up automatically; give it a **topic** matching an area id (e.g. `radar`) so it is grouped under the right research area.

## Group details

Name, introduction, links, funding and research areas are in [`data/site.json`](data/site.json).
