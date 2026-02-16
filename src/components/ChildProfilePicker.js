import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const profiles = ['Emma', 'Noah'];

export default function ChildProfilePicker({ onSelectChild }) {
  const [selected, setSelected] = useState(null);

    const onSelect = (name) => {
    setSelected(name);
    if (onSelectChild) onSelectChild(name);
    console.log('Selected profile:', name);
  };

  return (
    <View style={styles.container}>
      {profiles.map((p, idx) => {
        const active = selected === p;
        return (
          <TouchableOpacity
            key={p}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(p)}
            style={[
              styles.item,
              idx < profiles.length - 1 && styles.itemSpacing,
              active && styles.itemActive,
            ]}
          >
            <Text style={[styles.name, active && styles.nameActive]}>{p}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
  },
  item: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 20,
    backgroundColor: '#2A1F47',
    borderWidth: 1,
    borderColor: 'rgba(160,120,255,0.2)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  itemSpacing: { marginRight: 0 },
  itemActive: {
    backgroundColor: '#2A1F47',
    borderColor: 'rgba(167,139,250,0.6)',
    shadowColor: "#A78BFA",
    shadowOpacity: 0.3,
  },
  name: { fontSize: 18, color: '#F5F3FF', fontWeight: '600' },
  nameActive: { fontWeight: '700', color: '#A78BFA' },
});
