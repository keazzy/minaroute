// Android/Web fallback - uses @gorhom/bottom-sheet for Android, Modal for Web
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetFlatList as BSFlatList,
    BottomSheetScrollView as BSScrollView,
    BottomSheetView as BSView,
} from '@gorhom/bottom-sheet';
import React, { forwardRef, ReactNode, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

const IS_WEB = Platform.OS === 'web';

export type NativeSheetRef = {
  present: () => void;
  dismiss: () => void;
  snapToIndex: (index: number) => void;
};

export type NativeSheetProps = {
  snapPoints: (string | number)[];
  children: ReactNode;
  onDismiss?: () => void;
  onChange?: (index: number) => void;
  enablePanDownToClose?: boolean;
  index?: number;
  topInset?: number;
  enableOverDrag?: boolean;
  backgroundStyle?: any;
  enableBackdropDismiss?: boolean;
  allowFullExpansion?: boolean;
  expandedOnly?: boolean;
  mediumOnly?: boolean;
};

// Web-specific sheet implementation using Modal
const WebNativeSheet = forwardRef<NativeSheetRef, NativeSheetProps>(
  (
    {
      snapPoints,
      children,
      onDismiss,
      onChange,
      enablePanDownToClose = true,
      backgroundStyle,
      enableBackdropDismiss = false,
      expandedOnly = false,
    },
    ref
  ) => {
    const [visible, setVisible] = useState(false);
    const { height: windowHeight } = useWindowDimensions();

    const getSheetHeight = useCallback(() => {
      const snapPoint = expandedOnly ? snapPoints[snapPoints.length - 1] : snapPoints[0];
      if (typeof snapPoint === 'string' && snapPoint.endsWith('%')) {
        return (parseFloat(snapPoint) / 100) * windowHeight;
      }
      return typeof snapPoint === 'number' ? snapPoint : windowHeight * 0.5;
    }, [snapPoints, windowHeight, expandedOnly]);

    const present = useCallback(() => {
      console.log('[WebNativeSheet] present() called');
      setVisible(true);
      onChange?.(0);
    }, [onChange]);

    const dismiss = useCallback(() => {
      console.log('[WebNativeSheet] dismiss() called');
      setVisible(false);
      onDismiss?.();
    }, [onDismiss]);

    useImperativeHandle(ref, () => ({
      present,
      dismiss,
      snapToIndex: () => {},
    }));

    const sheetHeight = getSheetHeight();

    if (!visible) return null;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={enablePanDownToClose ? dismiss : undefined}
      >
        <View style={styles.webOverlay}>
          <Pressable 
            style={styles.webBackdrop} 
            onPress={enableBackdropDismiss ? dismiss : undefined} 
          />
          <View
            style={[
              styles.webSheet,
              backgroundStyle,
              { height: sheetHeight },
            ]}
          >
            <View style={styles.webHandleContainer}>
              <View style={styles.webHandle} />
            </View>
            <View style={{ flex: 1 }}>
              {children}
            </View>
          </View>
        </View>
      </Modal>
    );
  }
);

// Android/Web sheet using BottomSheetModal for primary sheets, Modal for secondary popup sheets
const NativeSheetImpl = forwardRef<NativeSheetRef, NativeSheetProps>(
  (
    {
      snapPoints,
      children,
      onDismiss,
      onChange,
      enablePanDownToClose = true,
      index = 0,
      topInset,
      enableOverDrag = false,
      backgroundStyle,
      enableBackdropDismiss = false,
      expandedOnly = false,
    },
    ref
  ) => {
    // State for Modal-based fallback
    const [modalVisible, setModalVisible] = useState(false);
    const { height: windowHeight } = useWindowDimensions();
    
    // Ref for BottomSheetModal
    const sheetRef = useRef<BottomSheetModal>(null);
    
    // Popup modals use Modal component, primary sheets use BottomSheetModal (Android) or fixed View (Web)
    const isPopupModal = enableBackdropDismiss;
    // On web, primary sheets (home sheet) should NOT use Modal to avoid blocking background
    const useModal = isPopupModal; // Only popup modals use Modal, regardless of platform

    const getSheetHeight = useCallback(() => {
      const snapPoint = expandedOnly ? snapPoints[snapPoints.length - 1] : snapPoints[0];
      if (typeof snapPoint === 'string' && snapPoint.endsWith('%')) {
        return (parseFloat(snapPoint) / 100) * windowHeight;
      }
      return typeof snapPoint === 'number' ? snapPoint : windowHeight * 0.5;
    }, [snapPoints, windowHeight, expandedOnly]);

    const present = useCallback(() => {
      if (useModal) {
        console.log('[NativeSheet] present() - using Modal');
        setModalVisible(true);
        onChange?.(0);
      } else if (IS_WEB) {
        console.log('[NativeSheet] present() - web primary sheet, setting visible');
        setModalVisible(true);
        onChange?.(0);
      } else {
        console.log('[NativeSheet] present() - using BottomSheetModal');
        sheetRef.current?.present();
      }
    }, [useModal, onChange]);

    const dismiss = useCallback(() => {
      if (useModal || IS_WEB) {
        console.log('[NativeSheet] dismiss() - setting visible false');
        setModalVisible(false);
        onDismiss?.();
      } else {
        console.log('[NativeSheet] dismiss() - using BottomSheetModal');
        sheetRef.current?.dismiss();
      }
    }, [useModal, onDismiss]);

    useImperativeHandle(ref, () => ({
      present,
      dismiss,
      snapToIndex: (idx: number) => {
        if (!useModal && !IS_WEB) {
          sheetRef.current?.snapToIndex(idx);
        }
      },
    }));

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={enableBackdropDismiss ? 0 : 1}
          disappearsOnIndex={enableBackdropDismiss ? -1 : 0}
          opacity={0.25}
          pressBehavior={enableBackdropDismiss ? 'close' : 'none'}
        />
      ),
      [enableBackdropDismiss]
    );

    const startIndex = expandedOnly ? snapPoints.length - 1 : index;
    const sheetHeight = getSheetHeight();

    // 1. Popup modals (enableBackdropDismiss=true) use Modal with backdrop
    if (useModal) {
      if (!modalVisible) return null;
      
      return (
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={enablePanDownToClose ? dismiss : undefined}
        >
          <View style={styles.webOverlay}>
            <Pressable 
              style={styles.webBackdrop} 
              onPress={dismiss} 
            />
            <View
              style={[
                styles.webSheet,
                backgroundStyle,
                { height: sheetHeight },
              ]}
            >
              <View style={styles.webHandleContainer}>
                <View style={styles.webHandle} />
              </View>
              <View style={{ flex: 1 }}>
                {children}
              </View>
            </View>
          </View>
        </Modal>
      );
    }

    // 2. Web primary sheets (home sheet) - use fixed position View, NOT Modal
    if (IS_WEB) {
      if (!modalVisible) return null;
      
      return (
        <View 
          style={[
            styles.webPrimarySheet,
            backgroundStyle,
            { height: sheetHeight },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.webHandleContainer}>
            <View style={styles.webHandle} />
          </View>
          <View style={{ flex: 1 }} pointerEvents="auto">
            {children}
          </View>
        </View>
      );
    }

    // 3. Android primary sheets - use BottomSheetModal
    return (
      <BottomSheetModal
        ref={sheetRef}
        index={startIndex}
        snapPoints={snapPoints}
        onDismiss={onDismiss}
        onChange={onChange}
        enablePanDownToClose={enablePanDownToClose}
        enableOverDrag={enableOverDrag}
        backdropComponent={renderBackdrop}
        backgroundStyle={backgroundStyle || styles.background}
        handleIndicatorStyle={styles.indicator}
        topInset={topInset}
        activeOffsetX={[-15, 15]}
        activeOffsetY={[-5, 5]}
      >
        {children}
      </BottomSheetModal>
    );
  }
);

export const NativeSheet = NativeSheetImpl;

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#fff',
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  indicator: {
    backgroundColor: '#E5E5E5',
    width: 36,
  },
  // Web-specific styles
  webOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  webBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  webSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  webPrimarySheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  webHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  webHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
  },
});

// Re-export scroll components - use RN components on web, bottom-sheet components on Android
export const BottomSheetScrollView = IS_WEB ? ScrollView : BSScrollView;
export const BottomSheetFlatList = IS_WEB ? FlatList : BSFlatList;
export const BottomSheetView = IS_WEB ? View : BSView;

// SwiftUI sheet stub for Android/Web
export type SwiftUISheetRef = {
  present: () => void;
  dismiss: () => void;
};

export type SwiftUISheetProps = {
  children: ReactNode;
  onDismiss?: () => void;
};

export const SwiftUISheet = forwardRef<SwiftUISheetRef, SwiftUISheetProps>(
  (_props, ref) => {
    useImperativeHandle(ref, () => ({
      present: () => {},
      dismiss: () => {},
    }));
    return null;
  }
);
