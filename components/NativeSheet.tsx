// Android/Web fallback - uses @gorhom/bottom-sheet
import {
    BottomSheetBackdrop,
    BottomSheetFlatList,
    BottomSheetModal,
    BottomSheetScrollView,
    BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, { forwardRef, ReactNode, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';

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
  /** Background style for the sheet */
  backgroundStyle?: any;
  /** Whether to show backdrop that can dismiss sheet */
  enableBackdropDismiss?: boolean;
  /** iOS only: When false, sheet stays at medium height. Ignored on Android/Web. */
  allowFullExpansion?: boolean;
};

export const NativeSheet = forwardRef<NativeSheetRef, NativeSheetProps>(
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
    },
    ref
  ) => {
    const sheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
      snapToIndex: (idx: number) => sheetRef.current?.snapToIndex(idx),
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

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={index}
        snapPoints={snapPoints}
        onDismiss={onDismiss}
        onChange={onChange}
        enablePanDownToClose={enablePanDownToClose}
        enableOverDrag={enableOverDrag}
        backdropComponent={renderBackdrop}
        backgroundStyle={backgroundStyle || styles.background}
        handleIndicatorStyle={styles.indicator}
        topInset={topInset}
      >
        {children}
      </BottomSheetModal>
    );
  }
);

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
});

// Re-export scroll components for consistent API
export { BottomSheetFlatList, BottomSheetScrollView, BottomSheetView };

// SwiftUI sheet stub for Android/Web - falls back to nothing (use NativeSheet instead)
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
    // On Android/Web, SwiftUI sheet is not available - return null
    return null;
  }
);
