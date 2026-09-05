
import { Ionicons } from '@expo/vector-icons';
import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import { useNavigation } from '@react-navigation/native';
import type {
    NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { ROUTES } from '../../constants/routes';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { fetchMarketingDashboardStats } from '../../services/marketing/dashboard';

type NavigationProp =
    NativeStackNavigationProp<RootStackParamList>;

interface StatCardProps {
    title: string;
    value: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress?: () => void;
}

interface ActionCardProps {
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
}

function StatCard({
    title,
    value,
    description,
    icon,
    onPress,
}: StatCardProps) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.statCard,
                pressed && styles.pressed,
            ]}
            onPress={onPress}
        >
            <View style={styles.statIconContainer}>
                <Ionicons
                    name={icon}
                    size={20}
                    color={COLORS.teal}
                />
            </View>

            <Text style={styles.statTitle}>
                {title}
            </Text>

            <Text style={styles.statValue}>
                {value}
            </Text>

            <Text style={styles.statDescription}>
                {description}
            </Text>
        </Pressable>
    );
}

function ActionCard({
    title,
    description,
    icon,
    onPress,
}: ActionCardProps) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.pressed,
            ]}
            onPress={onPress}
        >
            <View style={styles.actionIconContainer}>
                <Ionicons
                    name={icon}
                    size={22}
                    color={COLORS.teal}
                />
            </View>

            <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>
                    {title}
                </Text>

                <Text style={styles.actionDescription}>
                    {description}
                </Text>
            </View>

            <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.muted}
            />
        </Pressable>
    );
}

export function MarketingDashboardScreen() {
    const navigation =
        useNavigation<NavigationProp>();

    const user = useAuthStore(
        (state) => state.user
    );

    const [stats, setStats] = useState({
        products: 0,
        packages: 0,
        applications: 0,
        activity: 0,
    });

    const [isLoadingStats, setIsLoadingStats] =
        useState(true);

    const [statsError, setStatsError] =
        useState<string | null>(null);

    const loadDashboardStats = useCallback(
        async () => {
            try {
                setIsLoadingStats(true);
                setStatsError(null);

                const dashboardStats =
                    await fetchMarketingDashboardStats();

                setStats(dashboardStats);
            } catch (error) {
                console.error(
                    'MARKETING DASHBOARD STATS ERROR:',
                    error,
                );

                setStatsError(
                    error instanceof Error
                        ? error.message
                        : 'Unable to load dashboard statistics.',
                );
            } finally {
                setIsLoadingStats(false);
            }
        },
        [],
    );

    useEffect(() => {
        loadDashboardStats();
    }, [loadDashboardStats]);

    const employeeName =
        user?.name?.trim() || 'Marketing Employee';

    const employeeNumber =
        user?.employeeNumber || 'Not assigned';

    const handleProfile = () => {
        navigation.navigate(
            ROUTES.EMPLOYEE_PROFILE
        );
    };

    const handleLogout = () => {
        // Logout functionality will be connected
        // to the central authentication flow.
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor={COLORS.background}
            />

            <ScrollView
                style={styles.container}
                contentContainerStyle={
                    styles.contentContainer
                }
                showsVerticalScrollIndicator={false}
            >
                {/* =====================================================
            HEADER
        ====================================================== */}

                <View style={styles.header}>
                    <View style={styles.headerText}>
                        <Text style={styles.eyebrow}>
                            MARKETING
                        </Text>

                        <Text style={styles.title}>
                            Dashboard
                        </Text>

                        <Text style={styles.subtitle}>
                            Manage the Green Off-Grid catalogue,
                            packages and customer activity.
                        </Text>
                    </View>

                    <Pressable
                        style={styles.profileButton}
                        onPress={handleProfile}
                    >
                        <Ionicons
                            name="person-outline"
                            size={21}
                            color={COLORS.teal}
                        />
                    </Pressable>
                </View>

                {/* =====================================================
            EMPLOYEE CARD
        ====================================================== */}

                <View style={styles.employeeCard}>
                    <View style={styles.employeeAvatar}>
                        <Ionicons
                            name="person"
                            size={24}
                            color={COLORS.white}
                        />
                    </View>

                    <View style={styles.employeeDetails}>
                        <Text style={styles.employeeGreeting}>
                            Welcome back
                        </Text>

                        <Text style={styles.employeeName}>
                            {employeeName}
                        </Text>

                        <Text style={styles.employeeNumber}>
                            Employee No. {employeeNumber}
                        </Text>
                    </View>

                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />

                        <Text style={styles.statusText}>
                            Active
                        </Text>
                    </View>
                </View>

                {/* =====================================================
            OVERVIEW
        ====================================================== */}

                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>
                            Overview
                        </Text>

                        <Text style={styles.sectionSubtitle}>
                            Current catalogue and application
                            activity.
                        </Text>
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <StatCard
                        title="Products"
                        value={
                            isLoadingStats
                                ? '...'
                                : String(stats.products)
                        }
                        description="Catalogue items"
                        icon="cube-outline"
                        onPress={() => {
                            navigation.navigate(
                                ROUTES.MARKETING_PRODUCTS,
                            );
                        }}
                    />

                    <StatCard
                        title="Packages"
                        value={
                            isLoadingStats
                                ? '...'
                                : String(stats.packages)
                        }
                        description="Franchise packages"
                        icon="briefcase-outline"
                        onPress={() => {
                            navigation.navigate(
                                ROUTES.MARKETING_PACKAGES
                            );
                        }}
                    />

                    <StatCard
                        title="Applications"
                        value={
                            isLoadingStats
                                ? '...'
                                : String(stats.applications)
                        }
                        description="Customer applications"
                        icon="document-text-outline"
                        onPress={() => {
                            console.log(
                                'Applications selected',
                            );
                        }}
                    />

                    <StatCard
                        title="Activity"
                        value={
                            isLoadingStats
                                ? '...'
                                : String(stats.activity)
                        }
                        description="Recent actions"
                        icon="time-outline"
                        onPress={() => {
                            console.log(
                                'Activity selected',
                            );
                        }}



                    />


                </View>

                {statsError ? (
                    <View style={styles.statsError}>
                        <Ionicons
                            name="alert-circle-outline"
                            size={18}
                            color={COLORS.danger}
                        />

                        <Text style={styles.statsErrorText}>
                            {statsError}
                        </Text>
                    </View>
                ) : null}


                {/* =====================================================
            CATALOGUE MANAGEMENT
        ====================================================== */}

                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>
                            Catalogue Management
                        </Text>

                        <Text style={styles.sectionSubtitle}>
                            Manage products and franchise packages.
                        </Text>
                    </View>
                </View>

                <View style={styles.actionList}>
                    <ActionCard
                        title="Products"
                        description="Add, view, edit and remove products."
                        icon="cube-outline"
                        onPress={() => {
                            navigation.navigate(ROUTES.MARKETING_PRODUCTS);
                        }}
                    />

                    <ActionCard
                        title="Franchise Packages"
                        description="Manage packages, pricing and package information."
                        icon="briefcase-outline"
                        onPress={() => {
                            navigation.navigate(
                                ROUTES.MARKETING_PACKAGES
                            );
                        }}
                    />

                    <ActionCard
                        title="Media Library"
                        description="Manage product and package images."
                        icon="images-outline"
                        onPress={() => {
                            // Media management will be connected here.
                        }}
                    />
                </View>

                {/* =====================================================
            CUSTOMER ACTIVITY
        ====================================================== */}

                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>
                            Customer Activity
                        </Text>

                        <Text style={styles.sectionSubtitle}>
                            Monitor franchise applications and
                            customer activity.
                        </Text>
                    </View>
                </View>

                <View style={styles.actionList}>
                    <ActionCard
                        title="Applications"
                        description="View and monitor franchise applications."
                        icon="document-text-outline"
                        onPress={() => {
                            navigation.navigate(ROUTES.MARKETING_APPLICATIONS);
                        }}
                    />

                    <ActionCard
                        title="Orders"
                        description="Manage customer orders and fulfilment."
                        icon="cube-outline"
                        onPress={() => {
                            navigation.navigate(ROUTES.MARKETING_ORDERS);
                        }}
                    />

                    <ActionCard
                        title="Messages"
                        description="Review customer communication and enquiries."
                        icon="chatbubble-outline"
                        onPress={() => {
                            navigation.navigate(ROUTES.MARKETING_ENQUIRIES);
                        }}
                    />

                    <ActionCard
                        title="Activity History"
                        description="Review actions performed by the marketing team."
                        icon="time-outline"
                        onPress={() => {
                            // Activity history will be connected here.
                        }}
                    />
                </View>

                {/* =====================================================
            ACCOUNT
        ====================================================== */}

                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>
                            Account
                        </Text>

                        <Text style={styles.sectionSubtitle}>
                            Manage your employee account.
                        </Text>
                    </View>
                </View>

                <View style={styles.accountCard}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.accountRow,
                            pressed && styles.pressed,
                        ]}
                        onPress={handleProfile}
                    >
                        <View style={styles.accountIcon}>
                            <Ionicons
                                name="person-outline"
                                size={20}
                                color={COLORS.teal}
                            />
                        </View>

                        <View style={styles.accountContent}>
                            <Text style={styles.accountTitle}>
                                Employee Profile
                            </Text>

                            <Text style={styles.accountDescription}>
                                View and update your employee information.
                            </Text>
                        </View>

                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={COLORS.muted}
                        />
                    </Pressable>

                    <View style={styles.divider} />

                    <Pressable
                        style={({ pressed }) => [
                            styles.accountRow,
                            pressed && styles.pressed,
                        ]}
                        onPress={handleLogout}
                    >
                        <View
                            style={[
                                styles.accountIcon,
                                styles.logoutIcon,
                            ]}
                        >
                            <Ionicons
                                name="log-out-outline"
                                size={20}
                                color={COLORS.danger}
                            />
                        </View>

                        <View style={styles.accountContent}>
                            <Text
                                style={[
                                    styles.accountTitle,
                                    styles.logoutText,
                                ]}
                            >
                                Sign Out
                            </Text>

                            <Text style={styles.accountDescription}>
                                Sign out of the marketing account.
                            </Text>
                        </View>

                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={COLORS.muted}
                        />
                    </Pressable>
                </View>

                <Text style={styles.footerText}>
                    Green Off-Grid Marketing Workspace
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

/* ============================================================
   COLORS
============================================================ */

const COLORS = {
    background: '#F7FAFA',
    surface: '#FFFFFF',
    border: '#E2EBEB',

    teal: '#24B8B8',
    tealDark: '#0D6464',
    tealLight: '#EEF9F9',

    text: '#163838',
    secondaryText: '#557070',
    muted: '#8A9B9B',

    white: '#FFFFFF',
    danger: '#C94A4A',

    success: '#27835C',
};

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    container: {
        flex: 1,
    },

    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },

    /* ----------------------------------------------------------
       HEADER
    ---------------------------------------------------------- */

    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 22,
    },

    headerText: {
        flex: 1,
        paddingRight: 16,
    },

    eyebrow: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.4,
        color: COLORS.tealDark,
        marginBottom: 5,
    },

    title: {
        fontSize: 30,
        fontWeight: '800',
        color: COLORS.text,
    },

    subtitle: {
        marginTop: 7,
        fontSize: 14,
        lineHeight: 21,
        color: COLORS.secondaryText,
    },

    profileButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    /* ----------------------------------------------------------
       EMPLOYEE CARD
    ---------------------------------------------------------- */

    employeeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 18,
        backgroundColor: COLORS.tealDark,
        marginBottom: 28,
    },

    employeeAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.16)',
    },

    employeeDetails: {
        flex: 1,
        marginLeft: 13,
    },

    employeeGreeting: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.72)',
        marginBottom: 2,
    },

    employeeName: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.white,
    },

    employeeNumber: {
        marginTop: 3,
        fontSize: 12,
        color: 'rgba(255,255,255,0.72)',
    },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },

    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#7BE0AE',
        marginRight: 6,
    },

    statusText: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.white,
    },

    /* ----------------------------------------------------------
       SECTION HEADERS
    ---------------------------------------------------------- */

    sectionHeader: {
        marginBottom: 13,
    },

    sectionTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: COLORS.text,
    },

    sectionSubtitle: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 19,
        color: COLORS.secondaryText,
    },

    /* ----------------------------------------------------------
       STATISTICS
    ---------------------------------------------------------- */

    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 28,
    },

    statCard: {
        width: '48.2%',
        minHeight: 142,
        padding: 15,
        marginBottom: 12,
        borderRadius: 17,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    statIconContainer: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.tealLight,
        marginBottom: 13,
    },

    statTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.secondaryText,
    },

    statValue: {
        marginTop: 3,
        fontSize: 25,
        fontWeight: '800',
        color: COLORS.text,
    },

    statDescription: {
        marginTop: 2,
        fontSize: 11,
        color: COLORS.muted,
    },

    /* ----------------------------------------------------------
       ACTION CARDS
    ---------------------------------------------------------- */

    actionList: {
        marginBottom: 28,
    },

    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 78,
        paddingHorizontal: 15,
        paddingVertical: 13,
        marginBottom: 10,
        borderRadius: 16,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    actionIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.tealLight,
    },

    actionContent: {
        flex: 1,
        marginLeft: 13,
        marginRight: 10,
    },

    actionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },

    actionDescription: {
        marginTop: 3,
        fontSize: 12,
        lineHeight: 17,
        color: COLORS.secondaryText,
    },

    /* ----------------------------------------------------------
       ACCOUNT
    ---------------------------------------------------------- */

    accountCard: {
        borderRadius: 17,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        marginBottom: 28,
    },

    accountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 78,
        paddingHorizontal: 15,
        paddingVertical: 12,
    },

    accountIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.tealLight,
    },

    logoutIcon: {
        backgroundColor: '#FFF3F3',
    },

    accountContent: {
        flex: 1,
        marginLeft: 12,
        marginRight: 10,
    },

    accountTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
    },

    accountDescription: {
        marginTop: 3,
        fontSize: 12,
        lineHeight: 17,
        color: COLORS.secondaryText,
    },

    logoutText: {
        color: COLORS.danger,
    },

    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginLeft: 69,
    },

    statsError: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        marginTop: -16,
        marginBottom: 20,
        borderRadius: 12,
        backgroundColor: '#FFF3F3',
        borderWidth: 1,
        borderColor: '#F2CACA',
    },

    statsErrorText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 17,
        color: COLORS.danger,
    },

    /* ----------------------------------------------------------
       FOOTER
    ---------------------------------------------------------- */

    footerText: {
        textAlign: 'center',
        fontSize: 11,
        color: COLORS.muted,
        marginTop: 4,
    },

    pressed: {
        opacity: 0.72,
    },
});

