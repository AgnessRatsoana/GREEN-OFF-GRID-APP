import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { appTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';

interface LogoItem {
  id: string;
  source: number;
  rotate: string;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

const checklistLogos: LogoItem[] = [
  {
    id: 'accenture',
    source: require('../../assets/images/accenture.jpeg'),
    rotate: '-6deg',
    offsetX: 6,
    offsetY: 0,
    width: 104,
    height: 44,
  },
  {
    id: 'mqa',
    source: require('../../assets/images/mqa.jpeg'),
    rotate: '5deg',
    offsetX: 130,
    offsetY: 10,
    width: 88,
    height: 48,
  },
  {
    id: 'khozeni',
    source: require('../../assets/images/khozeni.jpeg'),
    rotate: '-4deg',
    offsetX: 44,
    offsetY: 64,
    width: 108,
    height: 52,
  },
  {
    id: 'nyda',
    source: require('../../assets/images/nyda.jpeg'),
    rotate: '7deg',
    offsetX: 170,
    offsetY: 74,
    width: 82,
    height: 42,
  },
  {
    id: 'idc',
    source: require('../../assets/images/idc.jpeg'),
    rotate: '-7deg',
    offsetX: 98,
    offsetY: 126,
    width: 92,
    height: 44,
  },
];

const footerLogos: LogoItem[] = [
  {
    id: 'nyda-footer',
    source: require('../../assets/images/nyda.jpeg'),
    rotate: '-5deg',
    offsetX: 8,
    offsetY: 0,
    width: 88,
    height: 42,
  },
  {
    id: 'idc-footer',
    source: require('../../assets/images/idc.jpeg'),
    rotate: '6deg',
    offsetX: 114,
    offsetY: 10,
    width: 96,
    height: 44,
  },
];

const deals = [
  '160 Shopping centeres/malls enaged',
  '7 Municipality commitments',
  '18 Funding houses intending to explore the model',
];

export function ExistingClientChecklistSection() {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* Existing Client = plain, CHECKLIST = retro */}
      <View style={styles.checklistTitle}>
        <Text style={styles.titlePlain}>Existing Client </Text>

        <View style={styles.checklistWord}>
          <View
            style={[
              styles.letterTile,
              styles.tilePurple,
              styles.rotateNegative,
            ]}
          >
            <Text style={styles.tileLetter}>C</Text>
          </View>

          <Text style={[styles.retroLetter, styles.rotatePositive]}>
            H
          </Text>

          <View
            style={[
              styles.letterTile,
              styles.tileGreen,
              styles.rotateSlightNegative,
            ]}
          >
            <Text style={styles.tileLetter}>E</Text>
          </View>

          <Text style={styles.retroLetter}>C</Text>

          <View
            style={[
              styles.letterTile,
              styles.tileBlue,
              styles.rotatePositive,
            ]}
          >
            <Text style={styles.tileLetter}>K</Text>
          </View>

          <Text style={[styles.retroLetter, styles.rotateNegative]}>
            L
          </Text>

          <View
            style={[
              styles.letterTile,
              styles.tileOrange,
              styles.rotateSlightNegative,
            ]}
          >
            <Text style={styles.tileLetter}>I</Text>
          </View>

          <Text style={styles.retroLetter}>S</Text>

          <View
            style={[
              styles.letterTile,
              styles.tilePurple,
              styles.rotatePositive,
            ]}
          >
            <Text style={styles.tileLetter}>T</Text>
          </View>
        </View>
      </View>

      <View style={styles.logoBoard}>
        {checklistLogos.map((logo) => {
          return (
            <Image
              key={logo.id}
              source={logo.source}
              contentFit="contain"
              style={[
                styles.logo,
                {
                  width: logo.width,
                  height: logo.height,
                  left: logo.offsetX,
                  top: logo.offsetY,
                  transform: [{ rotate: logo.rotate }],
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.dealsSection}>
        {/* Deals = retro, We're Working On = plain */}
        <View style={styles.dealsTitle}>
          <View style={styles.dealsWord}>
            <View
              style={[
                styles.letterTile,
                styles.tileBlue,
                styles.rotateNegative,
              ]}
            >
              <Text style={styles.tileLetter}>D</Text>
            </View>

            <Text style={[styles.retroLetter, styles.rotatePositive]}>
              E
            </Text>

            <View
              style={[
                styles.letterTile,
                styles.tileGreen,
                styles.rotateSlightNegative,
              ]}
            >
              <Text style={styles.tileLetter}>A</Text>
            </View>

            <Text style={styles.retroLetter}>L</Text>

            <View
              style={[
                styles.letterTile,
                styles.tilePurple,
                styles.rotatePositive,
              ]}
            >
              <Text style={styles.tileLetter}>S</Text>
            </View>
          </View>

          <Text style={styles.dealsPlainText}> We're Working On</Text>
        </View>

        <View style={styles.dealsList}>
          {deals.map((deal) => {
            return (
              <Text key={deal} style={styles.dealText}>
                {deal}
              </Text>
            );
          })}
        </View>

        <View style={styles.footerLogoBoard}>
          {footerLogos.map((logo) => {
            return (
              <Image
                key={logo.id}
                source={logo.source}
                contentFit="contain"
                style={[
                  styles.footerLogo,
                  {
                    width: logo.width,
                    height: logo.height,
                    left: logo.offsetX,
                    top: logo.offsetY,
                    transform: [{ rotate: logo.rotate }],
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginTop: appTheme.spacing.xl,
    },

    /*
     * EXISTING CLIENT CHECKLIST TITLE
     */
    checklistTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      paddingRight: 8,
    },

    titlePlain: {
      color: theme.colors.supportPurple,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700',
      fontFamily: 'Retroma Vibes',
    },

    checklistWord: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      columnGap: 3,
    },

    /*
     * DEALS TITLE
     */
    dealsTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      paddingRight: 8,
    },

    dealsWord: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 3,
    },

    dealsPlainText: {
      color: theme.colors.textPrimary,
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '700',
      fontFamily: 'Retroma Vibes',
    },

    /*
     * RETRO LETTERS
     */
    retroLetter: {
      color: theme.colors.textPrimary,
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '900',
      fontFamily: 'Retroma Vibes',
    },

    letterTile: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 1,
    },

    tileLetter: {
      color: '#111111',
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '900',
      fontFamily: 'Retroma Vibes',
    },

    tilePurple: {
      backgroundColor: theme.colors.supportPurple,
    },

    tileGreen: {
      backgroundColor: theme.colors.primaryAccent,
    },

    tileBlue: {
      backgroundColor: '#65C7E8',
    },

    tileOrange: {
      backgroundColor: '#F3B562',
    },

    rotateNegative: {
      transform: [{ rotate: '-6deg' }],
    },

    rotatePositive: {
      transform: [{ rotate: '5deg' }],
    },

    rotateSlightNegative: {
      transform: [{ rotate: '-3deg' }],
    },

    /*
     * CLIENT LOGOS
     */
    logoBoard: {
      position: 'relative',
      height: 188,
      marginTop: appTheme.spacing.lg,
    },

    logo: {
      position: 'absolute',
    },

    /*
     * DEALS SECTION
     */
    dealsSection: {
      marginTop: appTheme.spacing.xl,
    },

    dealsList: {
      marginTop: appTheme.spacing.md,
      rowGap: appTheme.spacing.sm,
    },

    dealText: {
      color: theme.colors.textPrimary,
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '600',
    },

    /*
     * FOOTER LOGOS
     */
    footerLogoBoard: {
      position: 'relative',
      height: 64,
      marginTop: appTheme.spacing.lg,
    },

    footerLogo: {
      position: 'absolute',
    },
  });