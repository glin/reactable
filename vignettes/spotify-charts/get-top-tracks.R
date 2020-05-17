library(dplyr)
library(jsonlite)
library(spotifyr)

# Get global top 50 playlist tracks
global_top50 <- get_playlist_tracks("37i9dQZEVXbMDoHDwVN2tF")

# Get daily plays for the global daily top tracks
daily_plays <- read.csv("https://spotifycharts.com/regional/global/daily/latest/download",
                        skip = 1, encoding = "UTF-8", stringsAsFactors = FALSE)

# Make up some trends, since they're not provided by either data source
set.seed(20)
trend <- sample(c("unchanged", "up", "down", "new"), nrow(global_top50), replace = TRUE,
                prob = c(0.2, 0.35, 0.35, 0.1))

top_tracks <- global_top50 %>%
  left_join(daily_plays, by = c("track.external_urls.spotify" = "URL")) %>%
  mutate(trend = trend) %>%
  select(position = Position, trend = trend, name = track.name, artists = track.artists,
         album = track.album.name, explicit = track.explicit, daily_plays = Streams,
         duration_ms = track.duration_ms, url = track.external_urls.spotify,
         album_images = track.album.images)

# This is a nested data structure, so save as JSON
write_json(top_tracks, "top_tracks.json")
