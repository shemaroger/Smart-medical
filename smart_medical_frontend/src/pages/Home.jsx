import React, { useState, useEffect } from 'react';
import {
    Stethoscope,
    Users,
    Pill,
    MapPin,
    Shield,
    Clock,
    ArrowRight,
    Menu,
    X,
    CheckCircle,
    Star,
    Phone,
    Mail,
    Heart,
    Award,
    UserCheck,
    Building2,
    Smartphone
} from 'lucide-react';

const LandingPage = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        {
            icon: <Stethoscope className="w-8 h-8" />,
            title: "Smart Prescriptions",
            description: "Digital prescription management with automated pharmacy recommendations"
        },
        {
            icon: <Users className="w-8 h-8" />,
            title: "Multi-User Platform",
            description: "Integrated system for patients, doctors, and pharmacies"
        },
        {
            icon: <MapPin className="w-8 h-8" />,
            title: "Location-Based Services",
            description: "Find nearby pharmacies with your required medications"
        },
        {
            icon: <Shield className="w-8 h-8" />,
            title: "Secure & Compliant",
            description: "HIPAA compliant with end-to-end encryption for your data"
        },
        {
            icon: <Clock className="w-8 h-8" />,
            title: "Real-time Notifications",
            description: "Instant email alerts for appointments and prescriptions"
        },
        {
            icon: <Pill className="w-8 h-8" />,
            title: "Inventory Management",
            description: "Smart pharmacy inventory with low-stock alerts"
        }
    ];

    const stats = [
        { number: "10,000+", label: "Registered Users" },
        { number: "500+", label: "Healthcare Providers" },
        { number: "200+", label: "Partner Pharmacies" },
        { number: "50,000+", label: "Prescriptions Processed" }
    ];

    const testimonials = [
        {
            name: "Dr. Sarah Johnson",
            role: "Cardiologist, Central Hospital",
            content: "This platform has revolutionized how I manage patient prescriptions. The automated pharmacy recommendations save time and ensure patients get their medications efficiently.",
            rating: 5
        },
        {
            name: "Marie Uwimana",
            role: "Patient",
            content: "Finding the right pharmacy for my medications used to be a hassle. Now I get recommendations instantly and can pay online. It's incredibly convenient!",
            rating: 5
        },
        {
            name: "Jean Baptiste",
            role: "Pharmacy Owner",
            content: "The inventory management system helps us track stock levels and never run out of essential medications. Our customers are happier than ever.",
            rating: 5
        }
    ];

    const userTypes = [
        {
            icon: <Heart className="w-12 h-12" />,
            title: "For Patients",
            features: [
                "Book appointments with verified doctors",
                "Receive digital prescriptions instantly",
                "Get personalized pharmacy recommendations",
                "Track your medical history",
                "Secure online payments"
            ],
            color: "from-green-500 to-emerald-500"
        },
        {
            icon: <UserCheck className="w-12 h-12" />,
            title: "For Doctors",
            features: [
                "Manage patient appointments efficiently",
                "Create digital prescriptions easily",
                "Access comprehensive patient records",
                "Generate medical reports",
                "Real-time communication with patients"
            ],
            color: "from-teal-500 to-green-600"
        },
        {
            icon: <Building2 className="w-12 h-12" />,
            title: "For Pharmacies",
            features: [
                "Smart inventory management system",
                "Automated low-stock alerts",
                "Process digital prescriptions",
                "Revenue tracking and analytics",
                "Customer payment integration"
            ],
            color: "from-emerald-500 to-green-700"
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg' : 'bg-transparent'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-2">
                            <img
                                src="/public/Images/smartlogo .jpg"
                                alt="Smart Medical Logo"
                                className="w-24 h-10 rounded-full"
                            />
                            <span className={`text-xl font-bold ${isScrolled ? 'text-green-900' : 'text-white'}`}>
                                Smart Medical
                            </span>
                        </div>


                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className={`hover:text-green-600 transition-colors ${isScrolled ? 'text-gray-700' : 'text-white'
                                }`}>Features</a>
                            <a href="#about" className={`hover:text-green-600 transition-colors ${isScrolled ? 'text-gray-700' : 'text-white'
                                }`}>About</a>
                            <a href="#testimonials" className={`hover:text-green-600 transition-colors ${isScrolled ? 'text-gray-700' : 'text-white'
                                }`}>Reviews</a>
                            <a href="#contact" className={`hover:text-green-600 transition-colors ${isScrolled ? 'text-gray-700' : 'text-white'
                                }`}>Contact</a>
                            <a href='/login' className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition-colors">
                                Sign In
                            </a>
                            <a href='/signup' className="border border-green-700 text-green-700 px-6 py-2 rounded-lg hover:bg-green-700 hover:text-white transition-colors">
                                Register
                            </a>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? (
                                <X className={`w-6 h-6 ${isScrolled ? 'text-gray-900' : 'text-white'}`} />
                            ) : (
                                <Menu className={`w-6 h-6 ${isScrolled ? 'text-gray-900' : 'text-white'}`} />
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className="md:hidden bg-white border-t">
                            <div className="px-2 pt-2 pb-3 space-y-1">
                                <a href="#features" className="block px-3 py-2 text-gray-700 hover:text-green-600">Features</a>
                                <a href="#about" className="block px-3 py-2 text-gray-700 hover:text-green-600">About</a>
                                <a href="#testimonials" className="block px-3 py-2 text-gray-700 hover:text-green-600">Reviews</a>
                                <a href="#contact" className="block px-3 py-2 text-gray-700 hover:text-green-600">Contact</a>
                                <div className="flex flex-col space-y-2 px-3 py-2">
                                    <button className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors">
                                        Sign In
                                    </button>
                                    <button className="border border-green-700 text-green-700 px-4 py-2 rounded-lg hover:bg-green-700 hover:text-white transition-colors">
                                        Register
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center bg-gradient-to-br from-green-900 via-green-900 to-emerald-900">
                <div className="absolute inset-0 bg-black opacity-20"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="text-white">
                            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                                Revolutionizing
                                <span className="text-emerald-300"> Healthcare</span>
                                <br />Management
                            </h1>
                            <p className="text-xl md:text-2xl mb-8 text-green-100">
                                Connect patients, doctors, and pharmacies through our intelligent prescription management platform.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <button className="bg-emerald-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center">
                                    Get Started Today
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </button>
                                <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-green-900 transition-colors">
                                    Watch Demo
                                </button>
                            </div>
                            <div className="flex items-center space-x-6 text-green-100">
                                <div className="flex items-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                                    <span>HIPAA Compliant</span>
                                </div>
                                <div className="flex items-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                                    <span>24/7 Support</span>
                                </div>
                                <div className="flex items-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                                    <span>Mobile Ready</span>
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:block">
                            <div className="relative">
                                <div className="bg-white p-8 rounded-2xl shadow-2xl">
                                    <div className="text-center mb-6">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Quick Access</h3>
                                        <p className="text-gray-600">Choose your user type to get started</p>
                                    </div>
                                    <div className="space-y-4">
                                        <button className="w-full bg-green-50 border-2 border-green-200 p-4 rounded-lg hover:bg-green-100 transition-colors flex items-center">
                                            <Heart className="w-6 h-6 text-green-700 mr-3" />
                                            <div className="text-left">
                                                <div className="font-semibold text-gray-900">Patient Portal</div>
                                                <div className="text-sm text-gray-600">Book appointments & manage prescriptions</div>
                                            </div>
                                        </button>
                                        <button className="w-full bg-emerald-50 border-2 border-emerald-200 p-4 rounded-lg hover:bg-emerald-100 transition-colors flex items-center">
                                            <UserCheck className="w-6 h-6 text-emerald-700 mr-3" />
                                            <div className="text-left">
                                                <div className="font-semibold text-gray-900">Doctor Dashboard</div>
                                                <div className="text-sm text-gray-600">Manage patients & create prescriptions</div>
                                            </div>
                                        </button>
                                        <button className="w-full bg-teal-50 border-2 border-teal-200 p-4 rounded-lg hover:bg-teal-100 transition-colors flex items-center">
                                            <Building2 className="w-6 h-6 text-teal-700 mr-3" />
                                            <div className="text-left">
                                                <div className="font-semibold text-gray-900">Pharmacy System</div>
                                                <div className="text-sm text-gray-600">Inventory management & processing</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-green-700 mb-2">{stat.number}</div>
                                <div className="text-gray-600 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Why Choose Smart Medical?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Our comprehensive platform streamlines healthcare management with cutting-edge technology
                            and user-friendly interfaces designed for modern healthcare needs.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                                <div className="bg-green-100 w-16 h-16 rounded-lg flex items-center justify-center text-green-700 mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* User Types Section */}
            <section id="about" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Built for Everyone in Healthcare
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Our platform caters to all stakeholders in the healthcare ecosystem,
                            providing tailored experiences for each user type.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {userTypes.map((userType, index) => (
                            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                                <div className={`bg-gradient-to-r ${userType.color} w-20 h-20 rounded-2xl flex items-center justify-center text-white mb-6`}>
                                    {userType.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">{userType.title}</h3>
                                <ul className="space-y-3">
                                    {userType.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="flex items-start">
                                            <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-600">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className={`w-full mt-8 bg-gradient-to-r ${userType.color} text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity`}>
                                    Learn More
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            What Our Users Say
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Don't just take our word for it. Here's what healthcare professionals and patients
                            are saying about our platform.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-gray-50 p-8 rounded-2xl">
                                <div className="flex items-center mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                    ))}
                                </div>
                                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                                <div>
                                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                                    <div className="text-gray-600 text-sm">{testimonial.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-green-700 to-emerald-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to Transform Your Healthcare Experience?
                    </h2>
                    <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
                        Join thousands of healthcare professionals and patients who are already using
                        Smart Medical to streamline their healthcare management.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="bg-white text-green-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
                            Start Free Trial
                        </button>
                        <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-green-700 transition-colors">
                            Schedule Demo
                        </button>
                    </div>
                    <div className="mt-8 flex items-center justify-center space-x-6 text-green-100">
                        <div className="flex items-center">
                            <Smartphone className="w-5 h-5 mr-2" />
                            <span>Mobile App Available</span>
                        </div>
                        <div className="flex items-center">
                            <Award className="w-5 h-5 mr-2" />
                            <span>Award Winning Platform</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="bg-gray-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center space-x-2 mb-6">
                                <div className="bg-green-700 p-2 rounded-lg">
                                    <Stethoscope className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xl font-bold">Smart Medical</span>
                            </div>
                            <p className="text-gray-400 mb-6 max-w-md">
                                Revolutionizing healthcare management through intelligent technology
                                and seamless user experiences for patients, doctors, and pharmacies.
                            </p>
                            <div className="flex space-x-4">
                                <div className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
                            <ul className="space-y-3 text-gray-400">
                                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                                <li><a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-6">Contact Info</h3>
                            <div className="space-y-3 text-gray-400">
                                <div className="flex items-start">
                                    <MapPin className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
                                    <span>KN 4 Ave, Kigali, Rwanda</span>
                                </div>
                                <div className="flex items-center">
                                    <Phone className="w-5 h-5 mr-3 flex-shrink-0" />
                                    <span>+250 788 123 456</span>
                                </div>
                                <div className="flex items-center">
                                    <Mail className="w-5 h-5 mr-3 flex-shrink-0" />
                                    <span>info@smartmedical.rw</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                        <p>&copy; 2025 Smart Medical Prescription System. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;