
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { RootStackParamList } from '../../../navigation/types';

import {
  createMarketingPackage,
  deleteMarketingPackage,
  fetchMarketingPackages,
  updateMarketingPackage,
  type MarketingPackage,
} from '../../../services/marketing/packages';

type NavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

type PackageFilter = 'All' | 'Active' | 'Inactive';

type ButtonVariant = 'teal' | 'purple';

export function MarketingPackagesScreen() {
  const navigation = useNavigation<NavigationProp>();

  /* ============================================================
     PACKAGE STATE
  ============================================================ */

  const [packages, setPackages] = useState<MarketingPackage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] =
    useState<PackageFilter>('All');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ============================================================
     MODAL STATE
  ============================================================ */

  const [isModalVisible, setIsModalVisible] =
    useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [editingPackage, setEditingPackage] =
    useState<MarketingPackage | null>(null);

  /* ============================================================
     FORM STATE
  ============================================================ */

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] =
    useState('');
  const [formBullets, setFormBullets] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formRating, setFormRating] = useState('5');
  const [formButtonLabel, setFormButtonLabel] =
    useState('Select Package');
  const [formButtonVariant, setFormButtonVariant] =
    useState<ButtonVariant>('teal');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formIsActive, setFormIsActive] =
    useState(true);
  const [formDisplayOrder, setFormDisplayOrder] =
    useState('');

  /* ============================================================
     LOAD PACKAGES
  ============================================================ */

  const loadPackages = useCallback(async () => {
    try {
      setError(null);

      const data = await fetchMarketingPackages();

      setPackages(data);
    } catch (loadError) {
      console.error(
        'MARKETING PACKAGES ERROR:',
        loadError,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load franchise packages.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  /* ============================================================
     REFRESH
  ============================================================ */

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const data = await fetchMarketingPackages();

      setPackages(data);
    } catch (refreshError) {
      console.error(
        'MARKETING PACKAGES REFRESH ERROR:',
        refreshError,
      );

      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Unable to refresh franchise packages.',
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  /* ============================================================
     FORM RESET
  ============================================================ */

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormBullets('');
    setFormPrice('');
    setFormRating('5');
    setFormButtonLabel('Select Package');
    setFormButtonVariant('teal');
    setFormImageUrl('');
    setFormIsActive(true);
    setFormDisplayOrder('');
    setEditingPackage(null);
  };

  /* ============================================================
     OPEN CREATE MODAL
  ============================================================ */

  const openCreateModal = () => {
    resetForm();

    const nextDisplayOrder =
      packages.length > 0
        ? Math.max(
            ...packages.map(
              (item) => item.displayOrder,
            ),
          ) + 1
        : 1;

    setFormDisplayOrder(
      String(nextDisplayOrder),
    );

    setIsModalVisible(true);
  };

  /* ============================================================
     OPEN EDIT MODAL
  ============================================================ */

  const openEditModal = (
    packageItem: MarketingPackage,
  ) => {
    setEditingPackage(packageItem);

    setFormTitle(packageItem.title);
    setFormDescription(packageItem.description);
    setFormBullets(
      packageItem.bullets.join('\n'),
    );
    setFormPrice(String(packageItem.price));
    setFormRating(String(packageItem.rating));
    setFormButtonLabel(
      packageItem.buttonLabel,
    );
    setFormButtonVariant(
      packageItem.buttonVariant,
    );
    setFormImageUrl(
      packageItem.imageUrl ?? '',
    );
    setFormIsActive(packageItem.isActive);
    setFormDisplayOrder(
      String(packageItem.displayOrder),
    );

    setIsModalVisible(true);
  };

  /* ============================================================
     CLOSE MODAL
  ============================================================ */

  const closeModal = () => {
    if (isSaving) {
      return;
    }

    setIsModalVisible(false);
    resetForm();
  };

  /* ============================================================
     FORM VALIDATION
  ============================================================ */

  const validateForm = (): boolean => {
    if (!formTitle.trim()) {
      Alert.alert(
        'Missing Information',
        'Please enter a package title.',
      );
      return false;
    }

    if (!formDescription.trim()) {
      Alert.alert(
        'Missing Information',
        'Please enter a package description.',
      );
      return false;
    }

    const price = Number(formPrice);

    if (
      !formPrice.trim() ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      Alert.alert(
        'Invalid Price',
        'Please enter a valid package price.',
      );
      return false;
    }

    const rating = Number(formRating);

    if (
      !formRating.trim() ||
      !Number.isFinite(rating) ||
      rating < 0 ||
      rating > 5
    ) {
      Alert.alert(
        'Invalid Rating',
        'Rating must be between 0 and 5.',
      );
      return false;
    }

    const displayOrder = Number(
      formDisplayOrder,
    );

    if (
      !formDisplayOrder.trim() ||
      !Number.isInteger(displayOrder) ||
      displayOrder < 1
    ) {
      Alert.alert(
        'Invalid Display Order',
        'Display order must be a whole number greater than 0.',
      );
      return false;
    }

    return true;
  };

  /* ============================================================
     CREATE / UPDATE
  ============================================================ */

  const handleSavePackage = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      const bullets = formBullets
        .split('\n')
        .map((bullet) => bullet.trim())
        .filter(Boolean);

      const commonData = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        bullets,
        price: Number(formPrice),
        rating: Number(formRating),
        buttonLabel:
          formButtonLabel.trim() ||
          'Select Package',
        buttonVariant: formButtonVariant,
        imageUrl:
          formImageUrl.trim() || null,
        isActive: formIsActive,
        displayOrder: Number(
          formDisplayOrder,
        ),
      };

      if (editingPackage) {
        const updated =
          await updateMarketingPackage({
            id: editingPackage.id,
            ...commonData,
          });

        setPackages((current) =>
          current.map((item) =>
            item.id === updated.id
              ? updated
              : item,
          ),
        );

        Alert.alert(
          'Package Updated',
          `"${updated.title}" has been updated successfully.`,
        );
      } else {
        const created =
          await createMarketingPackage(
            commonData,
          );

        setPackages((current) =>
          [...current, created].sort(
            (a, b) =>
              a.displayOrder -
              b.displayOrder,
          ),
        );

        Alert.alert(
          'Package Created',
          `"${created.title}" has been added to the catalogue.`,
        );
      }

      setIsModalVisible(false);
      resetForm();
    } catch (saveError) {
      console.error(
        'PACKAGE SAVE ERROR:',
        saveError,
      );

      Alert.alert(
        'Save Failed',
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save the franchise package.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* ============================================================
     TOGGLE ACTIVE STATUS
  ============================================================ */

  const handleToggleStatus = (
    packageItem: MarketingPackage,
  ) => {
    const nextStatus =
      !packageItem.isActive;

    Alert.alert(
      nextStatus
        ? 'Activate Package'
        : 'Deactivate Package',
      nextStatus
        ? `Make "${packageItem.title}" available to customers?`
        : `Hide "${packageItem.title}" from customers?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: nextStatus
            ? 'Activate'
            : 'Deactivate',
          style: nextStatus
            ? 'default'
            : 'destructive',

          onPress: async () => {
            try {
              const updated =
                await updateMarketingPackage({
                  id: packageItem.id,
                  title: packageItem.title,
                  description:
                    packageItem.description,
                  bullets:
                    packageItem.bullets,
                  price: packageItem.price,
                  rating: packageItem.rating,
                  buttonLabel:
                    packageItem.buttonLabel,
                  buttonVariant:
                    packageItem.buttonVariant,
                  imageUrl:
                    packageItem.imageUrl,
                  isActive: nextStatus,
                  displayOrder:
                    packageItem.displayOrder,
                });

              setPackages((current) =>
                current.map((item) =>
                  item.id === updated.id
                    ? updated
                    : item,
                ),
              );
            } catch (statusError) {
              console.error(
                'PACKAGE STATUS UPDATE ERROR:',
                statusError,
              );

              Alert.alert(
                'Update Failed',
                statusError instanceof Error
                  ? statusError.message
                  : 'Unable to update package status.',
              );
            }
          },
        },
      ],
    );
  };

  /* ============================================================
     DELETE PACKAGE
  ============================================================ */

  const handleDeletePackage = (
    packageItem: MarketingPackage,
  ) => {
    Alert.alert(
      'Delete Package',
      `Are you sure you want to permanently delete "${packageItem.title}"? This cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',

          onPress: async () => {
            try {
              await deleteMarketingPackage(
                packageItem.id,
              );

              setPackages((current) =>
                current.filter(
                  (item) =>
                    item.id !== packageItem.id,
                ),
              );

              Alert.alert(
                'Package Deleted',
                `"${packageItem.title}" has been permanently deleted.`,
              );
            } catch (deleteError) {
              console.error(
                'PACKAGE DELETE ERROR:',
                deleteError,
              );

              Alert.alert(
                'Delete Failed',
                deleteError instanceof Error
                  ? deleteError.message
                  : 'Unable to delete the package.',
              );
            }
          },
        },
      ],
    );
  };

  /* ============================================================
     PACKAGE DETAILS
  ============================================================ */

  const handlePackagePress = (
    packageItem: MarketingPackage,
  ) => {
    Alert.alert(
      packageItem.title,
      packageItem.description,
      [
        {
          text: 'Close',
          style: 'cancel',
        },
        {
          text: 'Edit',
          onPress: () =>
            openEditModal(packageItem),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            handleDeletePackage(packageItem),
        },
      ],
    );
  };

  /* ============================================================
     COUNTS
  ============================================================ */

  const activeCount = packages.filter(
    (item) => item.isActive,
  ).length;

  const inactiveCount = packages.filter(
    (item) => !item.isActive,
  ).length;

  /* ============================================================
     FILTERING
  ============================================================ */

  const filteredPackages = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    return packages.filter((item) => {
      const matchesSearch =
        !query ||
        item.title
          .toLowerCase()
          .includes(query) ||
        item.description
          .toLowerCase()
          .includes(query) ||
        item.bullets.some((bullet) =>
          bullet
            .toLowerCase()
            .includes(query),
        );

      const matchesFilter =
        selectedFilter === 'All' ||
        (selectedFilter === 'Active' &&
          item.isActive) ||
        (selectedFilter === 'Inactive' &&
          !item.isActive);

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [
    packages,
    searchQuery,
    selectedFilter,
  ]);

  /* ============================================================
     IMAGE
  ============================================================ */

  const renderPackageImage = (
    packageItem: MarketingPackage,
  ) => {
    if (packageItem.imageUrl) {
      return (
        <Image
          source={{
            uri: packageItem.imageUrl,
          }}
          style={styles.packageImage}
          resizeMode="cover"
        />
      );
    }

    return (
      <View
        style={styles.packageImagePlaceholder}
      >
        <Ionicons
          name="briefcase-outline"
          size={30}
          color={COLORS.muted}
        />
      </View>
    );
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.teal}
          />
        }
      >
        {/* =====================================================
            HEADER
        ====================================================== */}

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Pressable
                style={({ pressed }) => [
                  styles.backButton,
                  pressed &&
                    styles.pressed,
                ]}
                onPress={() =>
                  navigation.goBack()
                }
              >
                <Ionicons
                  name="arrow-back"
                  size={21}
                  color={COLORS.text}
                />
              </Pressable>

              <View
                style={styles.headerText}
              >
                <Text
                  style={styles.eyebrow}
                >
                  CATALOGUE
                </Text>

                <Text
                  style={styles.title}
                >
                  Franchise Packages
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.subtitle}>
            Manage the packages available to
            prospective Green Off-Grid
            franchisees.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.createButton,
              pressed &&
                styles.pressed,
            ]}
            onPress={openCreateModal}
          >
            <Ionicons
              name="add"
              size={18}
              color={COLORS.white}
            />

            <Text
              style={
                styles.createButtonText
              }
            >
              Create Package
            </Text>
          </Pressable>
        </View>

        {/* =====================================================
            SUMMARY
        ====================================================== */}

        <View style={styles.summaryCard}>
          <View
            style={styles.summaryHeader}
          >
            <View
              style={
                styles.summaryHeaderText
              }
            >
              <Text
                style={styles.summaryTitle}
              >
                Package Catalogue
              </Text>

              <Text
                style={
                  styles.summarySubtitle
                }
              >
                Review pricing, package
                information and customer
                availability.
              </Text>
            </View>

            <View
              style={styles.summaryIcon}
            >
              <Ionicons
                name="briefcase-outline"
                size={23}
                color={COLORS.teal}
              />
            </View>
          </View>

          <View
            style={styles.summaryStats}
          >
            <View
              style={styles.summaryStat}
            >
              <Text
                style={styles.summaryValue}
              >
                {packages.length}
              </Text>

              <Text
                style={styles.summaryLabel}
              >
                Total
              </Text>
            </View>

            <View
              style={styles.statDivider}
            />

            <View
              style={styles.summaryStat}
            >
              <Text
                style={styles.summaryValue}
              >
                {activeCount}
              </Text>

              <Text
                style={styles.summaryLabel}
              >
                Active
              </Text>
            </View>

            <View
              style={styles.statDivider}
            />

            <View
              style={styles.summaryStat}
            >
              <Text
                style={styles.summaryValue}
              >
                {inactiveCount}
              </Text>

              <Text
                style={styles.summaryLabel}
              >
                Inactive
              </Text>
            </View>
          </View>
        </View>

        {/* =====================================================
            SEARCH
        ====================================================== */}

        <View
          style={styles.searchContainer}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.muted}
          />

          <TextInput
            value={searchQuery}
            onChangeText={
              setSearchQuery
            }
            placeholder="Search packages..."
            placeholderTextColor={
              COLORS.muted
            }
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {searchQuery.length > 0 ? (
            <Pressable
              onPress={() =>
                setSearchQuery('')
              }
            >
              <Ionicons
                name="close-circle"
                size={19}
                color={COLORS.muted}
              />
            </Pressable>
          ) : null}
        </View>

        {/* =====================================================
            FILTERS
        ====================================================== */}

        <View style={styles.filterRow}>
          {(
            ['All', 'Active', 'Inactive'] as const
          ).map((filter) => {
            const selected =
              selectedFilter === filter;

            return (
              <Pressable
                key={filter}
                style={[
                  styles.filterButton,
                  selected &&
                    styles.filterButtonSelected,
                ]}
                onPress={() =>
                  setSelectedFilter(filter)
                }
              >
                <Text
                  style={[
                    styles.filterText,
                    selected &&
                      styles.filterTextSelected,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={19}
              color={COLORS.danger}
            />

            <Text
              style={styles.errorText}
            >
              {error}
            </Text>

            <Pressable
              style={styles.retryButton}
              onPress={() => {
                setIsLoading(true);
                loadPackages();
              }}
            >
              <Text
                style={styles.retryText}
              >
                Retry
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* =====================================================
            SECTION
        ====================================================== */}

        <View
          style={styles.sectionHeader}
        >
          <View>
            <Text
              style={styles.sectionTitle}
            >
              Packages
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              {filteredPackages.length}{' '}
              package
              {filteredPackages.length === 1
                ? ''
                : 's'} displayed
            </Text>
          </View>
        </View>

        {/* =====================================================
            LOADING
        ====================================================== */}

        {isLoading ? (
          <View
            style={styles.loadingCard}
          >
            <ActivityIndicator
              size="small"
              color={COLORS.teal}
            />

            <Text
              style={styles.loadingText}
            >
              Loading franchise
              packages...
            </Text>
          </View>
        ) : filteredPackages.length ===
          0 ? (
          <View style={styles.emptyCard}>
            <View
              style={styles.emptyIcon}
            >
              <Ionicons
                name="briefcase-outline"
                size={30}
                color={COLORS.muted}
              />
            </View>

            <Text
              style={styles.emptyTitle}
            >
              No packages found
            </Text>

            <Text
              style={
                styles.emptyDescription
              }
            >
              Try changing your search or
              selected package filter.
            </Text>
          </View>
        ) : (
          <View
            style={styles.packageList}
          >
            {filteredPackages.map(
              (packageItem) => (
                <View
                  key={packageItem.id}
                  style={styles.packageCard}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.packageContent,
                      pressed &&
                        styles.pressed,
                    ]}
                    onPress={() =>
                      handlePackagePress(
                        packageItem,
                      )
                    }
                  >
                    {renderPackageImage(
                      packageItem,
                    )}

                    <View
                      style={
                        styles.packageMain
                      }
                    >
                      <View
                        style={
                          styles.packageTitleRow
                        }
                      >
                        <Text
                          style={
                            styles.packageTitle
                          }
                          numberOfLines={1}
                        >
                          {
                            packageItem.title
                          }
                        </Text>

                        <View
                          style={[
                            styles.statusBadge,
                            packageItem.isActive
                              ? styles.activeBadge
                              : styles.inactiveBadge,
                          ]}
                        >
                          <View
                            style={[
                              styles.statusDot,
                              packageItem.isActive
                                ? styles.activeDot
                                : styles.inactiveDot,
                            ]}
                          />

                          <Text
                            style={[
                              styles.statusText,
                              packageItem.isActive
                                ? styles.activeText
                                : styles.inactiveText,
                            ]}
                          >
                            {packageItem.isActive
                              ? 'Active'
                              : 'Inactive'}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={
                          styles.ratingRow
                        }
                      >
                        <Ionicons
                          name="star"
                          size={14}
                          color={
                            COLORS.star
                          }
                        />

                        <Text
                          style={
                            styles.ratingText
                          }
                        >
                          {packageItem.rating.toFixed(
                            1,
                          )}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.packageDescription
                        }
                        numberOfLines={3}
                      >
                        {
                          packageItem.description
                        }
                      </Text>

                      <View
                        style={
                          styles.bulletList
                        }
                      >
                        {packageItem.bullets
                          .slice(0, 3)
                          .map(
                            (bullet) => (
                              <View
                                key={
                                  bullet
                                }
                                style={
                                  styles.bulletRow
                                }
                              >
                                <View
                                  style={
                                    styles.bulletDot
                                  }
                                />

                                <Text
                                  style={
                                    styles.bulletText
                                  }
                                  numberOfLines={
                                    1
                                  }
                                >
                                  {
                                    bullet
                                  }
                                </Text>
                              </View>
                            ),
                          )}
                      </View>

                      <View
                        style={
                          styles.packageFooter
                        }
                      >
                        <View>
                          <Text
                            style={
                              styles.priceLabel
                            }
                          >
                            Investment
                          </Text>

                          <Text
                            style={
                              styles.packagePrice
                            }
                          >
                            R
                            {packageItem.price.toLocaleString(
                              'en-ZA',
                            )}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>

                  {/* =================================================
                      MANAGEMENT ACTIONS
                  ================================================== */}

                  <View
                    style={
                      styles.managementActions
                    }
                  >
                    <Pressable
                      style={[
                        styles.actionButton,
                        styles.editAction,
                      ]}
                      onPress={() =>
                        openEditModal(
                          packageItem,
                        )
                      }
                    >
                      <Ionicons
                        name="create-outline"
                        size={16}
                        color={
                          COLORS.tealDark
                        }
                      />

                      <Text
                        style={
                          styles.editActionText
                        }
                      >
                        Edit
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.actionButton,
                        packageItem.isActive
                          ? styles.deactivateButton
                          : styles.activateButton,
                      ]}
                      onPress={() =>
                        handleToggleStatus(
                          packageItem,
                        )
                      }
                    >
                      <Ionicons
                        name={
                          packageItem.isActive
                            ? 'eye-off-outline'
                            : 'eye-outline'
                        }
                        size={16}
                        color={
                          packageItem.isActive
                            ? COLORS.danger
                            : COLORS.tealDark
                        }
                      />

                      <Text
                        style={[
                          styles.statusButtonText,
                          packageItem.isActive
                            ? styles.deactivateText
                            : styles.activateText,
                        ]}
                      >
                        {packageItem.isActive
                          ? 'Deactivate'
                          : 'Activate'}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.actionButton,
                        styles.deleteAction,
                      ]}
                      onPress={() =>
                        handleDeletePackage(
                          packageItem,
                        )
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={
                          COLORS.danger
                        }
                      />

                      <Text
                        style={
                          styles.deleteActionText
                        }
                      >
                        Delete
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ),
            )}
          </View>
        )}

        {/* =====================================================
            MANAGEMENT NOTE
        ====================================================== */}

        <View
          style={styles.managementNote}
        >
          <Ionicons
            name="information-circle-outline"
            size={19}
            color={COLORS.tealDark}
          />

          <Text
            style={
              styles.managementNoteText
            }
          >
            Deactivating a package removes
            it from the active customer
            catalogue without deleting its
            information from the database.
            Delete permanently removes the
            package.
          </Text>
        </View>

        <Text style={styles.footerText}>
          Green Off-Grid Marketing
          Workspace
        </Text>
      </ScrollView>

      {/* ==========================================================
          CREATE / EDIT MODAL
      =========================================================== */}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={styles.modalContainer}
          >
            <View
              style={styles.modalHeader}
            >
              <View>
                <Text
                  style={
                    styles.modalEyebrow
                  }
                >
                  {editingPackage
                    ? 'EDIT PACKAGE'
                    : 'NEW PACKAGE'}
                </Text>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  {editingPackage
                    ? 'Edit Franchise Package'
                    : 'Create Franchise Package'}
                </Text>
              </View>

              <Pressable
                style={
                  styles.modalCloseButton
                }
                onPress={closeModal}
                disabled={isSaving}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={COLORS.text}
                />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={
                styles.modalContent
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={
                false
              }
            >
              {/* TITLE */}

              <Text
                style={styles.formLabel}
              >
                Package Title
              </Text>

              <TextInput
                value={formTitle}
                onChangeText={
                  setFormTitle
                }
                placeholder="e.g. INNOVATIVE PRO"
                placeholderTextColor={
                  COLORS.muted
                }
                style={styles.formInput}
                autoCapitalize="characters"
              />

              {/* DESCRIPTION */}

              <Text
                style={styles.formLabel}
              >
                Description
              </Text>

              <TextInput
                value={formDescription}
                onChangeText={
                  setFormDescription
                }
                placeholder="Describe what the package offers..."
                placeholderTextColor={
                  COLORS.muted
                }
                style={[
                  styles.formInput,
                  styles.formTextArea,
                ]}
                multiline
                textAlignVertical="top"
              />

              {/* BULLETS */}

              <Text
                style={styles.formLabel}
              >
                Package Benefits
              </Text>

              <Text
                style={
                  styles.formHint
                }
              >
                Enter one benefit per line.
              </Text>

              <TextInput
                value={formBullets}
                onChangeText={
                  setFormBullets
                }
                placeholder={
                  'Scalable for medium ventures\nAdvanced energy management\nFull brand materials'
                }
                placeholderTextColor={
                  COLORS.muted
                }
                style={[
                  styles.formInput,
                  styles.formTextArea,
                ]}
                multiline
                textAlignVertical="top"
              />

              {/* PRICE + RATING */}

              <View
                style={
                  styles.formRow
                }
              >
                <View
                  style={styles.formHalf}
                >
                  <Text
                    style={
                      styles.formLabel
                    }
                  >
                    Price (R)
                  </Text>

                  <TextInput
                    value={formPrice}
                    onChangeText={
                      setFormPrice
                    }
                    placeholder="350000"
                    placeholderTextColor={
                      COLORS.muted
                    }
                    style={
                      styles.formInput
                    }
                    keyboardType="decimal-pad"
                  />
                </View>

                <View
                  style={styles.formHalf}
                >
                  <Text
                    style={
                      styles.formLabel
                    }
                  >
                    Rating
                  </Text>

                  <TextInput
                    value={formRating}
                    onChangeText={
                      setFormRating
                    }
                    placeholder="5"
                    placeholderTextColor={
                      COLORS.muted
                    }
                    style={
                      styles.formInput
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* BUTTON LABEL */}

              <Text
                style={styles.formLabel}
              >
                Button Label
              </Text>

              <TextInput
                value={formButtonLabel}
                onChangeText={
                  setFormButtonLabel
                }
                placeholder="Select Package"
                placeholderTextColor={
                  COLORS.muted
                }
                style={styles.formInput}
              />

              {/* BUTTON VARIANT */}

              <Text
                style={styles.formLabel}
              >
                Button Variant
              </Text>

              <View
                style={
                  styles.variantRow
                }
              >
                {(
                  ['teal', 'purple'] as const
                ).map((variant) => {
                  const selected =
                    formButtonVariant ===
                    variant;

                  return (
                    <Pressable
                      key={variant}
                      style={[
                        styles.variantButton,
                        selected &&
                          styles.variantButtonSelected,
                      ]}
                      onPress={() =>
                        setFormButtonVariant(
                          variant,
                        )
                      }
                    >
                      <View
                        style={[
                          styles.variantDot,
                          variant ===
                          'teal'
                            ? styles.tealVariantDot
                            : styles.purpleVariantDot,
                        ]}
                      />

                      <Text
                        style={[
                          styles.variantText,
                          selected &&
                            styles.variantTextSelected,
                        ]}
                      >
                        {variant
                          .charAt(0)
                          .toUpperCase() +
                          variant.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* IMAGE */}

              <Text
                style={styles.formLabel}
              >
                Image URL
              </Text>

              <TextInput
                value={formImageUrl}
                onChangeText={
                  setFormImageUrl
                }
                placeholder="https://..."
                placeholderTextColor={
                  COLORS.muted
                }
                style={styles.formInput}
                autoCapitalize="none"
                keyboardType="url"
              />

              {/* DISPLAY ORDER */}

              <Text
                style={styles.formLabel}
              >
                Display Order
              </Text>

              <TextInput
                value={
                  formDisplayOrder
                }
                onChangeText={
                  setFormDisplayOrder
                }
                placeholder="1"
                placeholderTextColor={
                  COLORS.muted
                }
                style={styles.formInput}
                keyboardType="number-pad"
              />

              {/* ACTIVE STATUS */}

              <Text
                style={styles.formLabel}
              >
                Customer Availability
              </Text>

              <Pressable
                style={[
                  styles.availabilityToggle,
                  formIsActive
                    ? styles.availabilityActive
                    : styles.availabilityInactive,
                ]}
                onPress={() =>
                  setFormIsActive(
                    (current) =>
                      !current,
                  )
                }
              >
                <View
                  style={
                    styles.availabilityLeft
                  }
                >
                  <Ionicons
                    name={
                      formIsActive
                        ? 'eye-outline'
                        : 'eye-off-outline'
                    }
                    size={19}
                    color={
                      formIsActive
                        ? COLORS.tealDark
                        : COLORS.danger
                    }
                  />

                  <View
                    style={
                      styles.availabilityTextContainer
                    }
                  >
                    <Text
                      style={
                        styles.availabilityTitle
                      }
                    >
                      {formIsActive
                        ? 'Active'
                        : 'Inactive'}
                    </Text>

                    <Text
                      style={
                        styles.availabilitySubtitle
                      }
                    >
                      {formIsActive
                        ? 'Visible in the customer catalogue'
                        : 'Hidden from the customer catalogue'}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.toggleTrack,
                    formIsActive
                      ? styles.toggleTrackActive
                      : styles.toggleTrackInactive,
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      formIsActive
                        ? styles.toggleThumbActive
                        : styles.toggleThumbInactive,
                    ]}
                  />
                </View>
              </Pressable>

              {/* SAVE */}

              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed &&
                    styles.pressed,
                  isSaving &&
                    styles.disabledButton,
                ]}
                onPress={
                  handleSavePackage
                }
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.white}
                  />
                ) : (
                  <Ionicons
                    name={
                      editingPackage
                        ? 'save-outline'
                        : 'add-circle-outline'
                    }
                    size={19}
                    color={COLORS.white}
                  />
                )}

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  {isSaving
                    ? 'Saving...'
                    : editingPackage
                      ? 'Save Changes'
                      : 'Create Package'}
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.cancelButton
                }
                onPress={closeModal}
                disabled={isSaving}
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancel
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
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

  purple: '#7B61C9',
  purpleLight: '#F3EFFF',

  text: '#163838',
  secondaryText: '#557070',
  muted: '#8A9B9B',

  white: '#FFFFFF',
  danger: '#C94A4A',

  activeBackground: '#EEF8F3',
  activeText: '#27835C',

  inactiveBackground: '#FFF3F3',
  inactiveText: '#A33B3B',

  star: '#E7A91A',
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

  /* Header */

  header: {
    marginBottom: 22,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 12,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: COLORS.tealDark,
    marginBottom: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 9,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.secondaryText,
  },

  createButton: {
    marginTop: 14,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 13,
    backgroundColor: COLORS.tealDark,
  },

  createButtonText: {
    marginLeft: 7,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },

  /* Summary */

  summaryCard: {
    padding: 17,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  summaryHeaderText: {
    flex: 1,
    paddingRight: 10,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  summarySubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.secondaryText,
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.tealLight,
  },

  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },

  summaryStat: {
    flex: 1,
  },

  summaryValue: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.text,
  },

  summaryLabel: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.muted,
  },

  statDivider: {
    width: 1,
    height: 35,
    backgroundColor: COLORS.border,
  },

  /* Search */

  searchContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    fontSize: 14,
    color: COLORS.text,
  },

  /* Filters */

  filterRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },

  filterButtonSelected: {
    backgroundColor: COLORS.tealDark,
    borderColor: COLORS.tealDark,
  },

  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },

  filterTextSelected: {
    color: COLORS.white,
  },

  /* Error */

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 14,
    backgroundColor: '#FFF3F3',
    borderWidth: 1,
    borderColor: '#F2CACA',
    marginBottom: 18,
  },

  errorText: {
    flex: 1,
    marginLeft: 8,
    marginRight: 10,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.danger,
  },

  retryButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
  },

  retryText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  /* Section */

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.secondaryText,
  },

  /* Loading */

  loadingCard: {
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.secondaryText,
  },

  /* Package */

  packageList: {
    marginBottom: 18,
  },

  packageCard: {
    marginBottom: 12,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  packageContent: {
    flexDirection: 'row',
    padding: 13,
  },

  packageImage: {
    width: 100,
    height: 100,
    borderRadius: 13,
    backgroundColor: '#F0F5F5',
  },

  packageImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F5F5',
  },

  packageMain: {
    flex: 1,
    marginLeft: 13,
  },

  packageTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  packageTitle: {
    flex: 1,
    paddingRight: 8,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },

  activeBadge: {
    backgroundColor: COLORS.activeBackground,
  },

  inactiveBadge: {
    backgroundColor: COLORS.inactiveBackground,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  activeDot: {
    backgroundColor: COLORS.activeText,
  },

  inactiveDot: {
    backgroundColor: COLORS.inactiveText,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },

  activeText: {
    color: COLORS.activeText,
  },

  inactiveText: {
    color: COLORS.inactiveText,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  ratingText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondaryText,
  },

  packageDescription: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.secondaryText,
  },

  bulletList: {
    marginTop: 7,
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },

  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.teal,
    marginRight: 6,
  },

  bulletText: {
    flex: 1,
    fontSize: 10,
    color: COLORS.secondaryText,
  },

  packageFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 9,
  },

  priceLabel: {
    fontSize: 9,
    color: COLORS.muted,
  },

  packagePrice: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  /* Management actions */

  managementActions: {
    flexDirection: 'row',
    paddingHorizontal: 13,
    paddingBottom: 13,
    gap: 7,
  },

  actionButton: {
    flex: 1,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },

  editAction: {
    backgroundColor: COLORS.tealLight,
  },

  editActionText: {
    marginLeft: 5,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.tealDark,
  },

  deactivateButton: {
    backgroundColor: '#FFF3F3',
  },

  activateButton: {
    backgroundColor: COLORS.tealLight,
  },

  statusButtonText: {
    marginLeft: 5,
    fontSize: 10,
    fontWeight: '700',
  },

  deactivateText: {
    color: COLORS.danger,
  },

  activateText: {
    color: COLORS.tealDark,
  },

  deleteAction: {
    backgroundColor: '#FFF3F3',
  },

  deleteActionText: {
    marginLeft: 5,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.danger,
  },

  /* Empty */

  emptyCard: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F5F5',
    marginBottom: 13,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  emptyDescription: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.secondaryText,
  },

  /* Management Note */

  managementNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 13,
    borderRadius: 14,
    backgroundColor: COLORS.tealLight,
    marginTop: 4,
    marginBottom: 25,
  },

  managementNoteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.tealDark,
  },

  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.muted,
  },

  /* Modal */

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  modalContainer: {
    maxHeight: '94%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  modalEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: COLORS.tealDark,
  },

  modalTitle: {
    marginTop: 3,
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
  },

  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F5F5',
  },

  modalScroll: {
    flexGrow: 0,
  },

  modalContent: {
    padding: 20,
    paddingBottom: 35,
  },

  formLabel: {
    marginTop: 13,
    marginBottom: 7,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
  },

  formHint: {
    marginTop: -3,
    marginBottom: 7,
    fontSize: 10,
    color: COLORS.muted,
  },

  formInput: {
    minHeight: 46,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FBFDFD',
    color: COLORS.text,
    fontSize: 13,
  },

  formTextArea: {
    minHeight: 105,
    paddingTop: 12,
  },

  formRow: {
    flexDirection: 'row',
    gap: 10,
  },

  formHalf: {
    flex: 1,
  },

  variantRow: {
    flexDirection: 'row',
    gap: 9,
  },

  variantButton: {
    flex: 1,
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },

  variantButtonSelected: {
    borderColor: COLORS.tealDark,
    backgroundColor: COLORS.tealLight,
  },

  variantDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 7,
  },

  tealVariantDot: {
    backgroundColor: COLORS.teal,
  },

  purpleVariantDot: {
    backgroundColor: COLORS.purple,
  },

  variantText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondaryText,
  },

  variantTextSelected: {
    color: COLORS.tealDark,
  },

  availabilityToggle: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1,
  },

  availabilityActive: {
    backgroundColor: COLORS.tealLight,
    borderColor: '#CDEEEE',
  },

  availabilityInactive: {
    backgroundColor: '#FFF3F3',
    borderColor: '#F2CACA',
  },

  availabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  availabilityTextContainer: {
    marginLeft: 9,
  },

  availabilityTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },

  availabilitySubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.secondaryText,
  },

  toggleTrack: {
    width: 44,
    height: 25,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },

  toggleTrackActive: {
    backgroundColor: COLORS.teal,
  },

  toggleTrackInactive: {
    backgroundColor: '#D5DCDC',
  },

  toggleThumb: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },

  toggleThumbActive: {
    alignSelf: 'flex-end',
  },

  toggleThumbInactive: {
    alignSelf: 'flex-start',
  },

  saveButton: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    borderRadius: 13,
    backgroundColor: COLORS.tealDark,
  },

  saveButtonText: {
    marginLeft: 7,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },

  cancelButton: {
    minHeight: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: 13,
    backgroundColor: '#F0F5F5',
  },

  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondaryText,
  },

  disabledButton: {
    opacity: 0.6,
  },

  pressed: {
    opacity: 0.72,
  },
});

