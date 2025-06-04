import {StyleSheet} from 'react-native';

export const dashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
  },
  scroll: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#1E90FF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    marginTop: 40,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 4,
    marginTop: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  info: {
    fontSize: 14,
    color: '#444',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E90FF',
    marginRight: 12,
    backgroundColor: '#fff',
  },
  categoryItemSelected: {
    backgroundColor: '#1E90FF',
  },
  categoryTextSelected: {
    color: '#fff',
  },

  categoryText: {
    color: '#1E90FF',
    marginLeft: 6,
    fontWeight: '600',
  },
  itemList: {
    paddingVertical: 10,
    paddingLeft: 5,
  },
  itemCard: {
    backgroundColor: '#1E90FF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 22,
    marginRight: 12,
  },
  itemText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#ff4d4d',
    borderRadius: 10,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
  },
});
