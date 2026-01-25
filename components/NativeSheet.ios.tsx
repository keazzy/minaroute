// iOS-only - uses native SwiftUI BottomSheet from @expo/ui
// Based on: https://github.com/expo/expo/blob/main/apps/native-component-list/src/screens/UI/BottomSheetScreen.ios.tsx
import { BottomSheet, Group, Host, RNHostView } from '@expo/ui/swift-ui';
import {
  interactiveDismissDisabled,
  presentationBackgroundInteraction,
  presentationDetents,
  presentationDragIndicator,
  type PresentationDetent,
} from '@expo/ui/swift-ui/modifiers';
import React, { forwardRef, ReactNode, useCallback, useImperativeHandle, useState } from 'react';
import { FlatList, ScrollView, useWindowDimensions, View } from 'react-native';

export type NativeSheetRef = {
  present: () => void;
  dismiss: () => void;
  snapToIndex: (index: number) => void;
};

export type NativeSheetProps = {
  snapPoints?: (string | number)[];
  children: ReactNode;
  onDismiss?: () => void;
  onChange?: (index: number) => void;
  enablePanDownToClose?: boolean;
  index?: number;
  topInset?: number;
  enableOverDrag?: boolean;
  backgroundStyle?: any;
  enableBackdropDismiss?: boolean;
  /** If true, sheet opens at large detent only (for modal sheets like Submit Place) */
  expandedOnly?: boolean;
};

export const NativeSheet = forwardRef<NativeSheetRef, NativeSheetProps>(
  ({ children, onDismiss, enablePanDownToClose = true, expandedOnly = false }, ref) => {
    const [isPresented, setIsPresented] = useState(false);
    const { width, height } = useWindowDimensions();

    useImperativeHandle(ref, () => ({
      present: () => setIsPresented(true),
      dismiss: () => setIsPresented(false),
      snapToIndex: () => {},
    }));

    const handlePresentedChange = useCallback(
      (presented: boolean) => {
        // If dismissal is disabled, prevent closing
        if (!presented && !enablePanDownToClose) {
          return;
        }
        setIsPresented(presented);
        if (!presented && onDismiss) {
          onDismiss();
        }
      },
      [onDismiss, enablePanDownToClose]
    );

    // Determine detents based on sheet type
    // Use fractions for precise control
    console.log('NativeSheet expandedOnly:', expandedOnly);
    const detents: PresentationDetent[] = expandedOnly
      ? ['large']
      : [{ fraction: 0.4 }, 'large'];
    console.log('NativeSheet detents:', detents);

    // Build modifiers array
    const modifiers = [
      presentationDetents(detents),
      presentationDragIndicator('visible'),
    ];

    // Only add background interaction for non-expanded sheets (home sheet)
    // Enable map interaction when at the smaller detent
    if (!expandedOnly) {
      modifiers.push(presentationBackgroundInteraction({ detent: { fraction: 0.4 } }));
    }

    // Disable swipe-to-dismiss if enablePanDownToClose is false
    if (!enablePanDownToClose) {
      modifiers.push(interactiveDismissDisabled());
    }

    // Calculate content height based on detent
    // Medium is roughly 50% of screen, large is ~90%
    const contentHeight = expandedOnly ? height * 0.9 : height * 0.85;

    return (
      <Host style={{ position: 'absolute', width: 0, height: 0 }} pointerEvents="box-none">
        <BottomSheet isPresented={isPresented} onIsPresentedChange={handlePresentedChange}>
          <Group modifiers={modifiers}>
            <RNHostView>
              <View style={{ width, height: contentHeight }}>
                {children}
              </View>
            </RNHostView>
          </Group>
        </BottomSheet>
      </Host>
    );
  }
);

// Export RN scroll components for API compatibility with existing code
export const BottomSheetScrollView = ScrollView;
export const BottomSheetFlatList = FlatList;
export const BottomSheetView = View;

// Stub exports for compatibility (not used on iOS but needed for imports)
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
