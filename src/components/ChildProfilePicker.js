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
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E8E0D5',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  itemSpacing: { marginRight: 0 },
  itemActive: {
    backgroundColor: '#fff',
    borderColor: '#D4A574',
    shadowColor: "#D4A574",
    shadowOpacity: 0.15,
  },
  name: { fontSize: 18, color: '#222222', fontWeight: '600' },
  nameActive: { fontWeight: '700', color: '#D4A574' },
});
