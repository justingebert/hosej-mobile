import { Linking, View } from "react-native";
import { HapticPressable } from "@/components/ui/haptic-pressable";
import { AppleMusicIcon, SpotifyIcon, YouTubeIcon } from "./brand-icons";
import type { JukeboxSongDTO } from "@/lib/api/types/jukebox";

export function SongLinks({ song }: { song: JukeboxSongDTO }) {
  const term = encodeURIComponent(`${song.title} ${song.artist}`);

  const links = [
    {
      label: "Spotify",
      Icon: SpotifyIcon,
      url: `https://open.spotify.com/track/${song.spotifyTrackId}`,
    },
    {
      label: "Apple Music",
      Icon: AppleMusicIcon,
      url: `https://music.apple.com/de/search?term=${term}`,
    },
    {
      label: "YouTube",
      Icon: YouTubeIcon,
      url: `https://www.youtube.com/results?search_query=${term}`,
    },
  ];

  return (
    <View className="flex-row items-center gap-2">
      {links.map(({ label, Icon, url }) => (
        <HapticPressable
          key={label}
          haptic="light"
          onPress={() => Linking.openURL(url)}
          accessibilityRole="link"
          accessibilityLabel={`Open ${song.title} in ${label}`}
          className="size-11 items-center justify-center rounded-full active:opacity-60"
        >
          <Icon />
        </HapticPressable>
      ))}
    </View>
  );
}
