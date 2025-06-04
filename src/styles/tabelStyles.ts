import {StyleSheet} from 'react-native';

export const tabelStyles = StyleSheet.create({
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    color: '#1E90FF',
  },
  searchInput: {
    height: 40,
    borderColor: '#1E90FF',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    color: '#333',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerLabel: {
    marginRight: 12,
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#1E90FF',
    borderRadius: 6,
    overflow: 'hidden',
    width: 100,
    height: 40,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    height: 100,
    color: '#1E90FF',
    margin: 0,
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  evenRow: {
    backgroundColor: '#f9f9f9',
  },
  headerRow: {
    backgroundColor: '#1E90FF',
  },
  headerCell: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  cellNo: {
    width: 40,
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
  },
  cell: {
    width: 140,
    fontSize: 14,
    paddingHorizontal: 4,
  },
  cellText: {
    color: '#333',
  },
  expandedArea: {
    backgroundColor: '#e6f0ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#1E90FF',
  },
  expandedText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1E90FF',
    borderRadius: 6,
    marginHorizontal: 6,
  },
  pageButtonDisabled: {
    backgroundColor: '#aaa',
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 16,
    color: '#333',
    minWidth: 100,
    textAlign: 'center',
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },

  editButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },

  deleteButton: {
    backgroundColor: '#FF4136',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },

  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
