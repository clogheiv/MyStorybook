import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const profiles = ['Emma', 'Noah'];

export default function ChildProfilePicker() {
  const [selected, setSelected] = useState(null);

  const onSelect = (name) => {
    setSelected(name);
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
  container: { flexDirection: 'row' },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemSpacing: { marginRight: 12 },
  itemActive: { backgroundColor: '#eef6ff', borderColor: '#bfdbfe' },
  name: { fontSize: 16, color: '#0f172a' },
  nameActive: { fontWeight: '700' },
});
