
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '../../constants/routes';
import type { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { AppTheme } from '../../theme';

import {
  subscribeToNotifications,
  type AppNotification,
} from '../../services/notifications/notifications';

import { useNotificationStore } from '../../store/notificationStore';

import { FLOATING_NAV_CONTENT_INSET } from '../../components/common/FloatingBottomNav';

export function NotificationsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const notifications = useNotificationStore(
    (state) => state.notifications,
  );

  const unreadCount = useNotificationStore(
    (state) => state.unreadCount,
  );

  const isLoading = useNotificationStore(
    (state) => state.isLoading,
  );

  const loadNotifications = useNotificationStore(
    (state) => state.loadNotifications,
  );

  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  const markAsRead = useNotificationStore(
    (state) => state.markAsRead,
  );

  const markAllAsRead = useNotificationStore(
    (state) => state.markAllAsRead,
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null,
  );

  /*
   * Load notifications when this screen is opened.
   *
   * The Zustand store is now responsible for fetching the
   * notification records instead of duplicating the fetching
   * logic inside this screen.
   */
  useEffect(() => {
    setErrorMessage(null);

    loadNotifications().catch((error) => {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load notifications.',
      );
    });
  }, [loadNotifications]);

  /*
   * Listen for new notification records while this screen
   * is active.
   *
   * This allows a newly-created message/order/application
   * notification to appear without manually refreshing.
   */
  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;

    subscribeToNotifications((notification) => {
      if (disposed) {
        return;
      }

      addNotification(notification);
    })
      .then((cleanup) => {
        if (disposed) {
          cleanup();
          return;
        }

        unsubscribe = cleanup;
      })
      .catch(() => {
        // Realtime is optional; existing notifications can
        // still be displayed from the initial database load.
      });

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [addNotification]);

  /*
   * Pull-to-refresh.
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      await loadNotifications();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to refresh notifications.',
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  /*
   * Mark a notification as read and then navigate to the
   * appropriate section of the application.
   */
  const handleNotificationPress = async (
    notification: AppNotification,
  ) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }
    } catch {
      /*
       * Navigation should still happen even if the read
       * operation fails.
       */
    }

    /*
     * MESSAGE
     *
     * referenceId should contain the enquiry/conversation ID.
     */
    if (notification.type === 'message') {
      if (notification.referenceId) {
        navigation.navigate(ROUTES.ENQUIRY, {
          conversationId: notification.referenceId,
        });
      } else {
        navigation.navigate(
          ROUTES.MAIN_DRAWER,
          {
            screen: ROUTES.MESSAGES,
          } as never,
        );
      }

      return;
    }

    /*
     * ORDER CREATED
     */
    if (notification.type === 'order') {
      if (notification.referenceId) {
        navigation.navigate(ROUTES.ORDER_TRACKING, {
          orderId: notification.referenceId,
        });
      } else {
        navigation.navigate(ROUTES.ORDERS);
      }

      return;
    }

    /*
     * ORDER STATUS UPDATE
     */
    if (notification.type === 'order_status') {
      if (notification.referenceId) {
        navigation.navigate(ROUTES.ORDER_TRACKING, {
          orderId: notification.referenceId,
        });
      } else {
        navigation.navigate(ROUTES.ORDERS);
      }

      return;
    }

    /*
     * CART
     */
    if (notification.type === 'cart') {
      navigation.navigate(ROUTES.CART);
      return;
    }

    /*
     * PACKAGE APPLICATION
     */
    if (notification.type === 'application') {
      if (notification.referenceId) {
        navigation.navigate(ROUTES.APPLICATION_STATUS, {
          applicationId: notification.referenceId,
        });
      }

      return;
    }

    /*
     * APPLICATION STATUS UPDATE
     */
    if (notification.type === 'application_status') {
      if (notification.referenceId) {
        navigation.navigate(ROUTES.APPLICATION_STATUS, {
          applicationId: notification.referenceId,
        });
      }

      return;
    }
  };

  /*
   * Mark every notification as read.
   */
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      setErrorMessage(null);

      await markAllAsRead();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to mark notifications as read.',
      );
    }
  };

  /*
   * Notification icon.
   */
  const getNotificationIcon = (
    notification: AppNotification,
  ): keyof typeof Ionicons.glyphMap => {
    switch (notification.type) {
      case 'message':
        return 'chatbubble-ellipses-outline';

      case 'order':
        return 'bag-check-outline';

      case 'order_status':
        return 'cube-outline';

      case 'cart':
        return 'cart-outline';

      case 'application':
        return 'document-text-outline';

      case 'application_status':
        return 'checkmark-circle-outline';

      default:
        return 'notifications-outline';
    }
  };

  /*
   * Small category label.
   */
  const getNotificationLabel = (
    notification: AppNotification,
  ): string => {
    switch (notification.type) {
      case 'message':
        return 'MESSAGE';

      case 'order':
        return 'ORDER';

      case 'order_status':
        return 'ORDER UPDATE';

      case 'cart':
        return 'CART';

      case 'application':
        return 'APPLICATION';

      case 'application_status':
        return 'APPLICATION UPDATE';

      default:
        return 'NOTIFICATION';
    }
  };

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={theme.colors.primaryAccent}
          />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>
            Notifications
          </Text>

          {unreadCount > 0 ? (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          ) : null}
        </View>

        <Pressable
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={22}
            color={
              unreadCount > 0
                ? theme.colors.primaryAccent
                : theme.colors.textSecondary
            }
          />
        </Pressable>
      </View>

      {/* NOTIFICATION LIST */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              insets.bottom + FLOATING_NAV_CONTENT_INSET,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primaryAccent}
          />
        }
      >
        {/* LOADING */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={theme.colors.primaryAccent}
            />

            <Text style={styles.loadingText}>
              Loading notifications...
            </Text>
          </View>
        ) : null}

        {/* ERROR */}
        {errorMessage ? (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.primaryAccent}
            />

            <Text style={styles.errorText}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {/* EMPTY */}
        {!isLoading &&
        !errorMessage &&
        notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="notifications-off-outline"
                size={42}
                color={theme.colors.primaryAccent}
              />
            </View>

            <Text style={styles.emptyTitle}>
              You're all caught up
            </Text>

            <Text style={styles.emptySubtitle}>
              New messages, orders, application updates and
              other important activity will appear here.
            </Text>
          </View>
        ) : null}

        {/* RECORDS */}
        {!isLoading &&
        !errorMessage &&
        notifications.map((notification) => (
          <Pressable
            key={notification.id}
            style={[
              styles.notificationCard,
              !notification.isRead &&
                styles.unreadNotificationCard,
            ]}
            onPress={() =>
              handleNotificationPress(notification)
            }
          >
            <View
              style={[
                styles.notificationIcon,
                !notification.isRead &&
                  styles.unreadNotificationIcon,
              ]}
            >
              <Ionicons
                name={getNotificationIcon(notification)}
                size={24}
                color={theme.colors.primaryAccent}
              />
            </View>

            <View style={styles.notificationBody}>
              <View style={styles.notificationTopRow}>
                <Text style={styles.notificationLabel}>
                  {getNotificationLabel(notification)}
                </Text>

                {!notification.isRead ? (
                  <View style={styles.unreadDot} />
                ) : null}
              </View>

              <Text style={styles.notificationTitle}>
                {notification.title}
              </Text>

              <Text
                style={styles.notificationMessage}
                numberOfLines={3}
              >
                {notification.message}
              </Text>

              <Text style={styles.notificationDate}>
                {new Date(
                  notification.createdAt,
                ).toLocaleString()}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward-outline"
              size={18}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
    },

    headerTitleWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: theme.spacing.md,
      gap: theme.spacing.sm,
    },

    headerTitle: {
      color: theme.colors.textPrimary,
      fontSize: 24,
      fontWeight: '800',
    },

    headerBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primaryAccent,
    },

    headerBadgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '800',
    },

    markAllButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
    },

    content: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },

    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl,
    },

    loadingText: {
      marginTop: theme.spacing.sm,
      color: theme.colors.textSecondary,
      fontSize: 14,
    },

    errorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    errorText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },

    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xl * 2,
    },

    emptyIcon: {
      width: 82,
      height: 82,
      borderRadius: 41,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.md,
    },

    emptyTitle: {
      color: theme.colors.textPrimary,
      fontSize: 21,
      fontWeight: '800',
      textAlign: 'center',
    },

    emptySubtitle: {
      marginTop: theme.spacing.sm,
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
    },

    notificationCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    unreadNotificationCard: {
      borderColor: theme.colors.primaryAccent,
    },

    notificationIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },

    unreadNotificationIcon: {
      backgroundColor: theme.colors.surface,
    },

    notificationBody: {
      flex: 1,
    },

    notificationTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    notificationLabel: {
      color: theme.colors.primaryAccent,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.8,
    },

    unreadDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: theme.colors.primaryAccent,
    },

    notificationTitle: {
      marginTop: 4,
      color: theme.colors.textPrimary,
      fontSize: 16,
      fontWeight: '800',
      lineHeight: 21,
    },

    notificationMessage: {
      marginTop: 4,
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },

    notificationDate: {
      marginTop: theme.spacing.sm,
      color: theme.colors.textSecondary,
      fontSize: 11,
    },
  });

