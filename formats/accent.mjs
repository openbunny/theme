const channel = (hex, at) => `0x${hex.slice(at, at + 2).toUpperCase()}`;

export const accentFormat =
  (tokenPath) =>
  ({ dictionary, file }) => {
    const token = dictionary.allTokens.find(
      (t) => t.path.join('.') === tokenPath,
    );
    if (token === undefined) {
      throw new Error(
        `${file.destination}: accent token ${tokenPath} is missing`,
      );
    }
    const hex = token.$value;
    const contents = {
      colors: [
        {
          color: {
            'color-space': 'srgb',
            components: {
              alpha: '1.000',
              blue: channel(hex, 5),
              green: channel(hex, 3),
              red: channel(hex, 1),
            },
          },
          idiom: 'universal',
        },
      ],
      info: { author: 'xcode', version: 1 },
    };
    return `${JSON.stringify(contents, null, 2)}\n`;
  };
