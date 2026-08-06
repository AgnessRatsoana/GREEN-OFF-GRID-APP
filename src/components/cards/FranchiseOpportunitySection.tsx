import { StyleSheet, Text, View } from 'react-native';

import { appTheme } from '../../theme';

interface OpportunityItem {
  title: string;
  body: string;
}

const opportunityItems: OpportunityItem[] = [
  {
    title: 'High-demand market',
    body: 'Position your business in a fast-growing sector where sustainability, community impact and profitability now align.',
  },
  {
    title: 'Built-in support',
    body: 'From branding to launch operations, every franchise partner receives practical support that shortens the learning curve.',
  },
  {
    title: 'Premium positioning',
    body: 'Green of Grid is designed to feel modern, credible and investable for both entrepreneurs and corporate stakeholders.',
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
    color: appTheme.colors.textPrimary,
    fontSize: 25,
    lineHeight: 34,
    fontWeight: '800',
  },
  cardsColumn: {
    marginTop: appTheme.spacing.md,
    rowGap: appTheme.spacing.sm,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.background,
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
