import React from 'react'
import { ScrollView, Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import Colors from '../../constants/Colors'

export default function PrivacyPolicy() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.neutral[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: December 2024</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.sectionText}>
            SkillHub ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Personal Information:</Text> Name, email, phone, profile information, identity verification documents, payment information.
          </Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Service Information:</Text> Task postings, applications, messages, location data, device information, usage analytics.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
          <Text style={styles.sectionText}>
            • Create and manage your account{'\n'}
            • Connect customers with taskers{'\n'}
            • Process payments and transactions{'\n'}
            • Provide customer support{'\n'}
            • Send important notifications{'\n'}
            • Improve our services{'\n'}
            • Ensure platform safety
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Information Sharing</Text>
          <Text style={styles.sectionText}>
            We share information with other users as necessary for the service, with trusted service providers for payment processing and analytics, and when required by law or to protect safety.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Security</Text>
          <Text style={styles.sectionText}>
            We implement industry-standard security measures including encryption, access controls, and regular security audits to protect your personal information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Your Rights</Text>
          <Text style={styles.sectionText}>
            You have the right to access, update, delete your information, control communication preferences, and export your data. Contact us to exercise these rights.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
          <Text style={styles.sectionText}>
            Our Service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. International Transfers</Text>
          <Text style={styles.sectionText}>
            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Changes to This Policy</Text>
          <Text style={styles.sectionText}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy in the app and updating the "Last Updated" date.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact Us</Text>
          <Text style={styles.sectionText}>
            If you have any questions about this Privacy Policy, please contact us:
          </Text>
          <Text style={styles.contactInfo}>
            Email: privacy@skillhub.app{'\n'}
            Address: SkillHub Privacy Team{'\n'}
            Phone: [Your Contact Number]
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[900],
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[900],
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.neutral[700],
    marginBottom: 8,
  },
  bold: {
    fontWeight: '600',
    color: Colors.neutral[900],
  },
  contactInfo: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.neutral[700],
    marginTop: 8,
    fontFamily: 'monospace',
  },
  footer: {
    marginTop: 30,
    marginBottom: 40,
    padding: 20,
    backgroundColor: Colors.primary[50],
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500],
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.neutral[600],
    fontStyle: 'italic',
  },
})
