import { StyleSheet, Text, View } from 'react-native';

import { appTheme } from '../../theme';

interface OpportunityItem {
  title: string;
  body: string;
}

const opportunityItems: OpportunityItem[] = [
  {
    title: 'High-demand solar market',
    body: 'Position your business in a fast-growing sector where franchise services and accessories both generate strong demand.',
  },
  {
    title: 'Built-in support and stock flow',
    body: 'From branding to launch operations and product supply, our structure helps you sell confidently from day one.',
  },
  {
    title: 'Premium positioning',
    body: 'Green Off Grid is designed to feel modern, credible and investable for entrepreneurs, installers and corporate buyers.',
  },
];

export function FranchiseOpportunitySection() {
  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>
        Green of Grid is not just a business idea. It is a premium opportunity with structure, support and strong brand value.
      </Text>

      <View style={styles.cardsColumn}>
        {opportunityItems.map((item) => {
          return (
            <View
              key={item.title}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.body}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: appTheme.spacing.xl,
  },
  mainTitle: {
    color: '#111111',
    fontSize: 24,
    lineHeight: 33,
    fontWeight: '800',
  },
  cardsColumn: {
    marginTop: appTheme.spacing.md,
    rowGap: appTheme.spacing.sm,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(36,184,184,0.22)',
    backgroundColor: '#f5fcfc',
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.md,
    ...appTheme.shadows.card,
  },
  cardTitle: {
    color: appTheme.colors.textPrimary,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
  },
  cardBody: {
    marginTop: appTheme.spacing.xs,
    color: appTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
});
