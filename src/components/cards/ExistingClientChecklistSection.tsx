import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { appTheme } from '../../theme';

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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>exitsing client CHECKLIST</Text>

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
        <Text style={styles.title}>Deals we working on</Text>

        <View style={styles.dealsList}>
          {deals.map((deal) => {
            return (
              <Text
                key={deal}
                style={styles.dealText}
              >
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

const styles = StyleSheet.create({
  container: {
    marginTop: appTheme.spacing.xl,
  },
  title: {
    color: '#b89aff',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    fontFamily: 'Retroma Vibes',
    textTransform: 'none',
  },
  logoBoard: {
    position: 'relative',
    height: 188,
    marginTop: appTheme.spacing.lg,
  },
  logo: {
    position: 'absolute',
  },
  dealsSection: {
    marginTop: appTheme.spacing.xl,
  },
  dealsList: {
    marginTop: appTheme.spacing.md,
    rowGap: appTheme.spacing.sm,
  },
  dealText: {
    color: appTheme.colors.textPrimary,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
  },
  footerLogoBoard: {
    position: 'relative',
    height: 64,
    marginTop: appTheme.spacing.lg,
  },
  footerLogo: {
    position: 'absolute',
  },
});
