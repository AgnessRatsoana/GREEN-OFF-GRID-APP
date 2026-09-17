import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';

type ExpandableDescriptionProps = {
  text: string;
  textStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function ExpandableDescription({
  text,
  textStyle,
  numberOfLines = 8,
}: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasMoreText, setHasMoreText] = useState(false);

  if (!text?.trim()) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Hidden measurement text.
          This measures the complete description without displaying it. */}
      <Text
        style={[textStyle, styles.measurementText]}
        onTextLayout={(event) => {
          const lineCount = event.nativeEvent.lines.length;

          if (lineCount > numberOfLines) {
            setHasMoreText(true);
          }
        }}
        pointerEvents="none"
      >
        {text}
      </Text>

      {/* Visible description */}
      <Text
        style={textStyle}
        numberOfLines={isExpanded ? undefined : numberOfLines}
      >
        {text}
      </Text>

      {/* Only show controls when the description is longer than 8 lines */}
      {hasMoreText ? (
        <Text
          style={styles.toggleText}
          onPress={() => setIsExpanded((current) => !current)}
          accessibilityRole="button"
          accessibilityLabel={
            isExpanded
              ? 'Show less description'
              : 'Show more description'
          }
        >
          {isExpanded ? 'See less' : 'See more'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  measurementText: {
    position: 'absolute',
    left: 0,
    right: 0,
    opacity: 0,
    pointerEvents: 'none',
  },
  toggleText: {
    marginTop: 6,
    color: '#24B8B8',
    fontSize: 14,
    fontWeight: '700',
  },
});